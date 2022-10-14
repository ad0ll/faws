import test, {ExecutionContext} from "ava"
import {SupportedFileDownloadProtocols} from "../types";
import {downloadFile} from "../lib";
import * as fs from "fs";
import * as path from "path";
import shell from "shelljs";

const testingFilesPathPrefix = "/tmp/exec-client-testing"
const downloadFileTest = async (t: ExecutionContext, fileLocation: string, downloadProtocol: SupportedFileDownloadProtocols, pathPrefix: string): Promise<string> => {
    //TODO Assert CWD
    const downloadPath = path.join(testingFilesPathPrefix, pathPrefix)
    if(fs.existsSync(downloadPath)) {
        fs.rmSync(downloadPath, {recursive: true})
    }
    fs.mkdirSync(downloadPath, {recursive: true})
    const dockerfilePath = await downloadFile(fileLocation, downloadProtocol, downloadPath)
    t.is(dockerfilePath, path.join(downloadPath, "/execution-files/Dockerfile"))
    t.assert(fs.existsSync(path.join(downloadPath, "/execution-files/Dockerfile")))
    return dockerfilePath
}

// test("can download file with git", async t => {
//     await downloadFileTest(t, "git@github.com:ad0ll/docker-hello-world.git", "git", "git-download")
// })

test("can download zip file with http", async t => {
    await downloadFileTest(t, "https://github.com/ad0ll/docker-hello-world/archive/refs/heads/main.zip", "http", "zip-download")
})

test("can download tar.gz file with http", async t => {
  //TODO
    t.pass()
})
//
// test.after(t => {
//     // Delete all files created for testing
//     if(fs.existsSync(testingFilesPathPrefix)) {
//         fs.rmSync(testingFilesPathPrefix, {recursive: true})
//     }
//     // Prune dangling docker images
//     shell.exec("docker system prune -y")
// })