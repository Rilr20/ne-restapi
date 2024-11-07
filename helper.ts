import * as fs from 'fs'
import bcrypt from 'bcryptjs'

export function checkValidQuery(bookId: string, bookAmount: number): boolean {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const book = data.books.find((book: { id: string }) => book.id === bookId);
    if (book) {
        const cartItem = data.cart.find((cart: { id: string; }) => cart.id === bookId);

        //checks if it is larger than inventory
        if (book.inventory >= bookAmount) {
            if (cartItem) {
                //see if the amount added to cart is larger than inventory
                if (book.inventory >= cartItem.amount + bookAmount) {
                    return true
                } else {
                    return false
                }
            }
            return true
        } else {
            return false
        }
    }
    return false
}
export function checkValidQueryNegative(bookId: string, bookAmount: number): boolean {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    const cartItem = data.cart.find((cart: { id: string; }) => cart.id === bookId);
    if (cartItem) {


        if (bookAmount <= cartItem.amount) {
            return true
        } else {

            return false
        }
    } else {

        return false
    }
}
export function cartValue(): number {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    const cart = data.cart;
    const books = data.books;
    let sumOfItems = 0
    cart.forEach((item: { id: string, amount: number }) => {
        const book = books.find((book: { id: string; }) => book.id === item.id);



        sumOfItems += (item.amount * book.cost)

    });

    return sumOfItems
}

export function cleanCart() {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    data.cart = []
    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));

}
export function updateInventory() {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    const books = data.books;

    data.cart.forEach((item: { id: string, amount: number }) => {
        const book = books.find((book: { id: string; }) => book.id === item.id);
        book.inventory = book.inventory - item.amount
    });


    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));

}


export function checkIfInventoryIsZero() {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const books = data.books.filter((book: { inventory: number, limited: boolean }) => book.inventory === 0 && book.limited === false);
    const ids = books.map((book: { id: string }) => book.id)

    return ids
}

/* Function to get the hash of admin password */
// hashPassword("TomCruiseIsUnder170cm")
function hashPassword(password: string) {
    bcrypt.hash(password, 10, (err: any, hash: string) => {
        if (err) {
            console.error(err)
            return
        }
        return hash
        // console.log(hash);
    })
}

export function findUserToken(username: string): string {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    let token = ""
    const user = data.users.find((user: { name: string, }) => user.name === username);
    if (user) {
        token = user.token
    }
    return token
}

export function findUsersPassword(username: string, jsondata: { users: { name: string, password: string }[]; }) {
    let password = ""

    const user = jsondata.users.find((user: { name: string, }) => user.name === username);
    if (user) {
        password = user.password
    }

    return password
}

export async function verifyPassword(username: string, password: string): Promise<boolean> {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

    let userpassword = findUsersPassword(username, data)

    if (userpassword === "") {
        console.error("user does not exist");
        return false
    }
    const match = await bcrypt.compare(password, userpassword)

    if (match) {
        return true
    } else {
        return false
    }
}