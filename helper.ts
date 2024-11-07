import bcrypt from 'bcryptjs'

export function checkIfInventoryIsZero(books: [{ id: number, inventory: number, limited: boolean }]) {
    // const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const filteredbooks = books.filter((book: { inventory: number, limited: boolean }) => book.inventory === 0 && book.limited === false);
    const ids = filteredbooks.map((book: { id: number }) => book.id)
    console.log(ids);
    
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

export async function verifyPassword(userpassword: string, password: string): Promise<boolean> {
    const match = await bcrypt.compare(password, userpassword)
    return match
}