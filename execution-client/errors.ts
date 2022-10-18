export class ExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ExecutionError";
    }
}

export class SetupError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SetupError";
    }
}

export class PreflightError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PreflightError";
    }
}

export class BountyNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PreflightError";
    }
}

export class PostResultError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PreflightError";
    }
}