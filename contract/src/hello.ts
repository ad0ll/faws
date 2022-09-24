import {NearBindgen, view, call} from "near-sdk-js";


@NearBindgen({})
class Hello {
    greeting: string = "Hello";
private a:  string = "olleH?";
    @view({})
    getGreeting(): string {
        return this.greeting;
    }
    @view({})
    getA1(): string {
        return this.a;
    }
    @view({private: true})
    getA2(): string{
        return this.a + "private"
    }

    @call({})
    setGreeting({message}: {message: string}): void {
        this.greeting  = message
    }


}

