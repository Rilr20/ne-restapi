# Bookstore

Backend api build with Expressjs and Typescript. 

## How to run.

`npm install` - installs all dependencies.

`npm run dev` - starts nodemon and runs the api.

**Port `1337` is used for the api.**


# Customer Routes

routes that the customer has access to.

## POST /remove

Remove an item from the cart.

## Request Body
- `id`: number (required) - Id of the book.
- `amount`: Integer (required) - Number to be removed to cart.

## POST /add

Adds an item from the cart.

### Request Body
- `id`: number (required) - Id of the book.
- `amount`: Integer (required) - Number to be added to cart.

## GET /cart

Displays all item in cart and total price.

## POST /checkout

checks out all items if price is below $120.


# Admin Routes

## POST /admin/login

logs in the user returning a token.

### Request Body
- `username`: string (required) - name of the user.
- `password`: string (required) - password for the user.


## POST /admin/add

adds items to the inventory in sets of 10.

### Request Headers

- `token`: string (required) - token is required to access this route

### Request Body
- `username`: string (required) - name of the user.


## POST /admin/check

returns a list of all book id and the amount in inventory. It also says which books are out of stock (if they aren't of limited edition).

### Request Headers
- `token`: string (required) - token is required to access this route

### Request Body
- `username`: string (required) - name of the user.


<!--
    routes som ska finnas

    /** CUSTOMER */
    POST | add book to cart (add book to cart based on id, and how many) 
    GET  | check cart (see cart)
    POST | checkout (remove from inventory, check order size isn't above 120$)

    /** ADMIN */
    POST | restock book (increments of 10)
    POST | check inventory (lists all books and their inventory status)
    POST | login

    Function to check password
    Function to check inventory if book is at 0 then send warning/notification on subsequent calls 

-->

