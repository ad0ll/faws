import {logger} from "./logger";
import {Bounty, ClientConfig, ClientExecutionContext, ClientExecutionResult} from "./types";
import shell from "shelljs";
import path from "path";
import * as fs from "fs";
import os from "os";
import assert from "assert";
import {ExecutionError, PreflightError, SetupError} from "./errors";


// const exampleBounty: Bounty = {
//     id: "example-bounty",
//     owner_id: "example-owner",
//     coordinator_id: "example-coordinator",
//     file_location: "git@github.com:ad0ll/docker-hello-world.git",
//     file_download_protocol: "git",
//     success: false,
//     complete: false,
//     cancelled: false,
//     min_nodes: 2,
//     total_nodes: 5,
//     network_required: true,
//     gpu_required: false,
//     bounty_created: 0,
//     amt_storage: BigInt(10000000000000000000),
//     amt_node_reward: BigInt(10000000000000000000),
//     elected_nodes: [config.nodeId],
//     answers: {}
// }


// Check if there is a dockerfile at the root
export const verifyFileStructure = async (unpackedPath: string) => {
    // TODO
    // Verify file structure
}


export class Execution {
    public result: ClientExecutionResult = {} as ClientExecutionResult;
    private startTime = new Date().getTime();
    private endTime = 0;
    public executionContext: ClientExecutionContext = {} as ClientExecutionContext;

    constructor(
        config: ClientConfig,
        bounty: Bounty,
    ) {

        const storageRoot = config.bountyStorageDir.replace("$BOUNTY_ID", bounty.id)
        this.executionContext.config = config
        this.executionContext.bounty = bounty;
        this.executionContext.imageName = config.imageNameFormat.replace("$BOUNTY_ID", bounty.id)
        this.executionContext.containerName = config.containerNameFormat.replace("$BOUNTY_ID", bounty.id)
        this.executionContext.storage = {
            root: storageRoot,
            filesDir: path.join(storageRoot, "files"),
            resultDir: path.join(storageRoot, "result"),
            packageName: path.basename(bounty.file_location),
            packagePath: path.join(storageRoot, "files", path.basename(bounty.file_location)),
            dockerfilePath: path.join(storageRoot, "files", "Dockerfile")
        }
    }

    extractFile() {
        const {filesDir, packageName, packagePath, dockerfilePath} = this.executionContext.storage
        shell.cd(filesDir)
        if (packageName.endsWith(".zip")) {
            logger.debug(`unzip ${packagePath}`)
            const unzipRes = shell.exec(`unzip -oj ${packageName}`) //o=overwrite, j=no junk paths (i.e. drop first dir)
            if (unzipRes.code !== 0) {
                throw new SetupError(`unzipping file failed: ${unzipRes.stderr}`)
            }
        } else if (packageName.endsWith(".tar.gz")) {
            logger.debug(`untar ${packageName}`)
            const untarRes = shell.exec(`tar -xzf  ${packageName}`)
            if (untarRes.code !== 0) {
                throw new SetupError(`untar file failed: ${untarRes.stderr}`)
            }
        }
        // Once we're done extracting files, we should have a Dockerfile in the executionPath
        if (!fs.existsSync(dockerfilePath)) {
            throw new PreflightError(`Successfully extracted ${packagePath}, but could not find Dockerfile at: ${dockerfilePath}`)
        }
    }

    async buildImage() {
        const {bounty} = this.executionContext
        const {filesDir} = this.executionContext.storage
        const imageName = bounty.id
        shell.cd(filesDir)
        const args = bounty.build_args.reduce((acc, arg) => {
            return acc + ` --build-arg ${arg}`
        }, "")
        logger.info(`building docker image ${imageName}`)
        logger.debug(`command: docker image build ${args} -t ${imageName} ${filesDir}`)
        const res = shell.exec(`docker image build ${args} -t ${imageName} ${filesDir}`)
        if (res.code !== 0) throw new Error(`docker build failed: ${res.stderr}`)
        this.executionContext.imageName = imageName
    }

    findResultLine(input: string): string | undefined {
        return input.split(os.EOL).find(line => line.match(/^\{\s*"bounty_data":/))
    }

    async runImage(): Promise<ClientExecutionResult> {
        const {imageName} = this.executionContext
        const {config, bounty} = this.executionContext
        //TODO Need timeout
        const {code, stdout, stderr} = shell.exec(
            `docker container run \
                        --name ${bounty.id} \
                        ${config.storage.dockerRemoveContainerAfterRun ? "--rm" : ""} \
                        ${imageName} \
                        "${bounty.runtime_args}"`
        )
        //Result will be present regardless of whether there's errors, so check for the result line first

        const resultLine = this.findResultLine(stdout) || this.findResultLine(stderr)
        if (code !== 0 && !resultLine) throw new ExecutionError(`docker run failed with ${stderr}`)
        else if (code !== 0 && resultLine) throw new ExecutionError(`docker run failed with result: ${JSON.stringify(resultLine)}`)
        else if (!resultLine) throw new ExecutionError(`docker run succeeded, but no result found in docker run output`)
        const result: any = JSON.parse(resultLine)
        assert(result.bounty_data, "result.bounty_data is undefined")
        assert(typeof result.bounty_data.result === "string", "received non-string result")
        assert(typeof result.bounty_data.message === "string", "received non-string message")
        logger.info(`bounty has finished executing with the following result: ${JSON.stringify(result)}`)
        //After checking for the result line, check if it exited with an error, then throw so we can publish the failure
        if (code !== 0) {
            console.log("Docker exited with a non-zero code, throwing error")
            throw new ExecutionError(result.message || `docker container run failed with exit code ${code}`)
        }
        return result as ClientExecutionResult
    }


    // Using one of https, git, or ipfs, download the file to BOUNTY_STORAGE_LOCATION
    //All operations are done in execution_path, which is /tmp/bounty_data/<bountyId>/ by default
    async downloadFile() {
        const {file_location, file_download_protocol, id: bountyId} = this.executionContext.bounty;
        const {root, filesDir, resultDir, packagePath, packageName, dockerfilePath} = this.executionContext.storage
        logger.info(`Creating bounty storage directories for ${bountyId}`)
        logger.debug("storage.root: " + root)
        logger.debug(`storage.filesDir: ${filesDir}`)
        logger.debug(`storage.resultDir: ${resultDir}`)
        fs.mkdirSync(root, {recursive: true});
        fs.mkdirSync(filesDir, {recursive: true});
        fs.mkdirSync(resultDir, {recursive: true});
        shell.cd(filesDir)
        if (file_download_protocol === "git") {
            console.log(`cloning ${file_location} to ${filesDir}`)
            const res = shell.exec(`git clone ${file_location} ${filesDir}`);
            if (res.code !== 0) throw new Error(`git clone failed: ${res.stderr}`)
            if (!fs.existsSync(dockerfilePath)) {
                throw new SetupError("Successfully cloned git repo, but could not find Dockerfile at: " + dockerfilePath)
            }
            logger.info(`Successfully cloned git repo to ${filesDir}`)
        } else if (file_download_protocol === "ipfs") {
            throw new SetupError(`IPFS not yet supported`)
        } else if (file_download_protocol === "http") {
            const res = shell.exec(`wget ${file_location}`)
            if (res.code !== 0) throw new Error(`downloading file with wget failed: ${res.stderr}`)
            logger.debug(`downloaded ${packageName}, checking that ${packagePath} exists`)
            if (!fs.existsSync(packagePath)) {
                throw new SetupError(`Successfully downloaded ${packageName} from ${file_location}, but could not find ${packagePath}`)
            }
        } else {
            throw new SetupError(`Received unsupported file download protocol: ${file_download_protocol}`)
        }

    }

    cleanup() {
        const {config, bounty, imageName} = this.executionContext
        try {
            if (config.storage.dockerPurgeSystemAfterRun) {
                const res = shell.exec(`docker system prune -f`)
                if (res.code !== 0) logger.error(`docker system prune failed: ${res.stderr}`) //No need to throw because doesn't affect execution
            } else if (config.storage.dockerPurgeImagesAfterRun) { //No need to prune after pruning system since system prune includes images
                const res = shell.exec(`docker image prune -y`)
                if (res.code !== 0) logger.error(`docker image prune failed: ${res.stderr}`) //No need to throw because doesn't affect execution
            }
            if (config.storage.dockerRemoveContainerAfterRun) { //In case --rm didn't work, follow through here
                const {code} = shell.exec(`docker container ls -a ${bounty.id}`)
                if (code !== 0) {
                    logger.debug(`failed to list container named ${bounty.id}, assuming it doesn't exist`)
                    logger.error(`docker container ${bounty.id} does not exist`)
                } else {
                    const {code, stderr} = shell.exec(`docker container rm -f ${bounty.id}`)
                    if (code !== 0) {
                        logger.warn(`docker container rm failed with exit code ${code}, container is dangling: ${stderr}`)
                    }
                }
            }
            if (config.storage.dockerRemoveExecutionImageAfterRun) {
                const {code} = shell.exec(`docker images ${imageName} -q`)
                if (code !== 0) {
                    logger.debug(`failed to list image named ${imageName}, assuming it doesn't exist`)
                } else {
                    const {code, stderr} = shell.exec(`docker image rm -f ${imageName}`)
                    if (code !== 0) {
                        logger.warn(`docker container rm failed with exit code ${code}: ${stderr}`)
                    }
                }
            }
        } catch (e: any) {
            //This is not fatal (although it could eventually become fatal) so just log the error
            logger.error(`Encountered an unexpected error while cleaning up: ${e.message}`)

        }


    }

    // Fully validates and runs the bounty off chain, returning the result to the caller (ExecutionClient) to publish to the chain
    // Some validation is redundant with the on-chain validation, but it's better to be safe than sorry
    async execute(): Promise<ClientExecutionResult> {
        const {config, bounty} = this.executionContext
        try {
            const {file_location, file_download_protocol, elected_nodes} = bounty;

            logger.debug(`Verifying that ${config.nodeId} is an elected node`)
            if (!elected_nodes.includes(config.nodeId)
            ) {
                return {
                    result: "",
                    message: `Node ${config.nodeId} is not elected to run bounty ${bounty.id}`,
                    errorType: "NotElected"
                }
            }

            //TODO Verify that file location is a valid URL
            //TODO Verify that file download protocol is valid
            logger.debug(`Validating build args...`)
            for (const arg in bounty.build_args) {
                //Don't allow symbols (except for _ and -) in build arg contents
                if (!arg.match(/^[A-Za-z0-9\-_]+=[A-Za-z0-9\-_]+/)) {
                    return {
                        result: "",
                        message: `Received malformed build arg: ${arg}. Build args must be of the form <key>=<value>`,
                        errorType: "PreflightError"
                    }
                }
            }

            //TODO Initialize a sandbox to download the file and build the image
            logger.debug(`Downloading bounty file at ${file_location} using protocol ${file_download_protocol}`)
            await this.downloadFile();
            await this.buildImage();

            //TODO Initialize a sandbox to run the image
            const result = await this.runImage();

            logger.debug(`Successfully executed bounty ${bounty.id}, result:`, result)
            return result;
        } catch (e: any) {
            logger.error(`Error executing bounty ${bounty.id}: ${e}`)
            return {
                result: "",
                message: e.message,
                errorType: e.name
            }
        } finally {
            this.cleanup();
        }
    }
}