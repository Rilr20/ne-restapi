import express from 'express';
import bodyParser from 'body-parser';
import * as fs from 'fs'
import { cartValue, checkIfInventoryIsZero, } from './helper'
import { initialise } from './database'
import { removeFromCart, addToCart, checkout, login, addToInventory, checkToken, checkInventory } from './query'



const router = express.Router()
const port = process.env.port || 1337;
const app = express();

app.get("/init", async (req, res) => {
    const status = await initialise()
    console.log(status);

    if (status) {
        res.status(200).json({ message: "success" })
    } else {
        res.status(400).json({ message: "something went wrong" })
    }
})

app.get("/", (req, res) => {
    console.log("Hello World!")
    res.status(200).json({ message: "Hello World!" })
})

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())

app.use((req, res, next) => {
    console.info(`Got a request on: ${req.path} (${req.method})`)
    next();
})

app.listen(port, () => {
    console.log(`server is listening to port ${port}`)

})

/* CUSTOMER ROUTES */
/* Remove book from cart */
app.post("/remove", async (req, res) => {
    const itemId = req.body.id
    let amount = req.body.amount
    amount = Number(amount)

    if (!Number.isNaN(amount) && amount > 0) {
        let success = await removeFromCart(itemId, amount)

        success ? res.status(201).json({ message: `Cart removed ${amount} of book id ${itemId}` }) : res.status(400).json({ message: `Request is not valid` })
    } else {
        res.status(400).json({ message: "Invalid id or amount is larger than cart amount" })
    }
})
/* Add book to cart */
app.post("/add", async (req, res) => {
    const itemId = req.body.id
    let amount = req.body.amount
    amount = Number(amount)

    if (!Number.isNaN(amount) && amount > 0) {
        let success = await addToCart(itemId, amount)

        success ? res.status(201).json({ message: `Cart added ${amount} of book id ${itemId}` }) : res.status(400).json({ message: `Request is not valid` })
    } else {
        res.status(400).json({ "message": "Amount is not a number or 0 and less" })
    }
})
/* Check Cart */
app.get("/cart", (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    const value = cartValue()
    res.status(200).json({ cart: data.cart, value: `$${value}` })
})

/* Check out cart */
app.post("/checkout", async (req, res) => {
    const success = await checkout()

    success ? res.status(200).json({ "message": `Cart was Checked out` }) : res.status(400).json({ message: "Cart value is too large, Reduce to below $120" })
})

/* ADMIN ROUTES */
/* Login */
app.post("/login", async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    const response = await login(username, password)
    if (response[0]) {
        res.status(200).json({ token: response[1] })

    } else {

        res.status(400).json({ message: "invalid credidentials" })
    }
})

/* Restock book */
app.post("/admin/add", async (req, res) => {
    const username: string = req.body.username
    const token = req.headers.token

    const id = req.body.id
    const amount = req.body.amount

    if (!Number.isNaN(amount) && amount > 0) {

        const tokenCheck = await checkToken(username, token)
        if (!tokenCheck) {
            res.status(400).json({ message: "invalid token" })

        } else {
            const result = await addToInventory(id, amount)
            result ? res.status(201).json({ message: `success! book '${id}' stock updated with ${amount * 10} books` }) : res.status(400).json({ message: "Invalid request" })

        }
    } else {
        res.status(400).json({ "message": "Amount is not a number or 0 and less" })
    }
})

/* Check Inventory */
app.post("/admin/check", async (req, res) => {
    const username = req.body.username
    const token = req.headers.token

    const tokenCheck = await checkToken(username, token)
    if (tokenCheck) {
        const books: any = await checkInventory()
        const filteredBooks = books.map((book: { id: number, inventory: number, }) => ({ id: book.id, inventory: book.inventory }))
        const notInstock = checkIfInventoryIsZero(books)

        res.status(200).json({ books: `These books are not in stock ids: ${notInstock}!`, data: filteredBooks, })

    } else {
        res.status(400).json({ message: "invalid token" })
    }
})
