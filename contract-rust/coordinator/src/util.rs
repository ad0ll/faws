use lazy_static::lazy_static;
use regex::Regex;

//TODO, we should check if the location is valid in the contract, BUT, you should specify and verify the protocol in the UI
//This is mostly because 'git' can be a protocol for both http:// and git@host and we don't want to try and guess
pub fn file_location_protocol(file_location: String) -> String {
    //TODO lazy_static might no be necessary because this regex isn't being compiled in a loop.
    lazy_static! {
        static ref file_location_pattern: Regex = Regex::new(r"((((?P<protocol>[A-Za-z]{3,9}):(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)").unwrap();
    }
    // Below is from: https://stackoverflow.com/a/8234912
    //TODO This regex isn't perfect, but the recommended expression is massive
    let res = file_location_pattern.captures(file_location.as_str()).unwrap();
    println!("Protocol: {}", res.name("protocol").unwrap().as_str());
    return res.name("protocol").unwrap().as_str().to_string(); //TODO this is sloppy
}
