fn main() {
    let a:i32 = 2;     // Bit presentation 10
    let b:u8 = 254;     // Bit presentation 11
    let c: i32 = 4;
    let d: i32 = 978;
let test = vec![1 as u8, 8, 16, 255];
    let mut result:i32;

    // result = a & b; // for each bit, if both are 1 then 1 else 0
    // println!("(a & b) => {} ",result);

    // result = a | b; // for each bit if either or both are 1 then 1
    // println!("(a | b) => {} ",result) ;

    // result = a ^ b; // xor, for each bit if one is 1 and the other is  a then true
    // println!("(a ^ b) => {} ",result);

    // result = !b; // not, if 0 then 1. Often results in negatives because the leftmost bit is the
    // println!("Binary number: {:#04b}",b);

    // println!("Binary number: {:#04b}",!b);
    // println!("(!b) => {} ",result);

    result = a << b;
    println!("(a << b), {:b} => {}",result, a<<(b as i32));
    println!("(a << b), {:b} => {}",result, a<<b);

    // result = a >> b;
    // println!("(a >> b) => {}",result);
}