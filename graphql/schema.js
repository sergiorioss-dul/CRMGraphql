const { gql } = require('apollo-server');

const typeDefs = gql`
    type User {
        id: ID
        name: String
        lastName: String
        email: String
        createdAt: String
    }

    type Token {
        token: String
    }

    type Product {
        id: ID
        name: String
        stock: Int
        price: Float
        createdAt: String
    }

    type Order {
        id: ID
        order: [OrderGroup]
        total: Float
        customer: Customer
        seller: ID
        createdAt: String
        state: OrderState
    }

    type OrderGroup {
        id: ID
        quantity: Int
        name: String
        price: Float
    }

    type Customer {
        id:ID
        name: String
        lastName: String
        company: String
        email: String
        cellPhone: String
        seller: ID
    }

    type BestCustomers {
        total: Float
        customer: [Customer]
    }

    type BestSellers {
        total: Float
        seller: [User]
    }

    input AuthInput {
        email: String!
        password: String!
    }

    input ProductInput {
        name: String!
        stock: Int!
        price: Float!
    }

    input UserInput {
        name: String!
        lastName: String!
        email: String!
        password: String!
    }

    input CustomerInput {
        name: String!
        lastName: String!
        company: String!
        email: String!
        cellPhone: String
    }

    input OrderProductInput {
        id: ID
        quantity: Int
        name: String
        price: Float
    }

    input OrderInput {
        order: [OrderProductInput]
        total: Float
        customer: ID
        state: OrderState
    }

    enum OrderState {
        PENDING
        COMPLETED
        REJECTED
    }

    type Query {
        # Users 
        getUser: User

        # Products
        getAllProducts: [Product]
        getProduct(id: ID!): Product

        # Customer
        getAllCustomers: [Customer]
        getCustomerSellers: [Customer]
        getCustomer(id: ID!): Customer

        # Orders
        getAllOrders: [Order] 
        getOrderByCustomer: [Order]
        getOrder(id: ID!): Order
        getOrdersByState(state: String!): [Order]

        # Extra Querys
        getBestCustomers: [BestCustomers]
        getBestSellers: [BestSellers]
        searchForProduct(text: String!): [Product] 
    }

    type Mutation {
        # Users 
        newUser(input: UserInput): User
        authUser(input: AuthInput): Token

        # Products
        newProduct(input: ProductInput): Product
        updateProduct(id: ID!, input: ProductInput): Product
        removeProduct(id: ID!): String

       # Customer
       addNewCustomer(input: CustomerInput): Customer
       updateCustomer(id: ID!, input: CustomerInput): Customer
       deleteCustomer(id: ID!): String

       # Orders
       newOrder(input: OrderInput): Order
       updateOrder(id: ID!, input: OrderInput): Order
       removeOrder(id: ID!): String
    }
`

module.exports = typeDefs
