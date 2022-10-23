

// Happens when the node is first starting, thrown if the node is missing software or is unable to go through its initialization ceremonies
// Typically fatal
export class SetupError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SetupError";
    }
}

// Everything prior
export class PreflightError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PreflightError";
    }
}

export class ExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ExecutionError";
    }
}

export class BountyNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BountyNotFoundError";
    }
}

export class PostExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PostExecutionError";
    }
}