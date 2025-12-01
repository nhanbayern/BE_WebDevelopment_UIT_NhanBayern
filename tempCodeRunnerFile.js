// hash.mjs
import bcrypt from "bcryptjs";

const [, , password = "HelloWorld", rounds = "10"] = process.argv;
//nguyễn thiện nhân: 123
//đỗ hoàng phúc: 1234
const hash = await bcrypt.hash(password, parseInt(rounds, 10));
console.log(hash);
// tạo tài khoản hash vào trong dbms
