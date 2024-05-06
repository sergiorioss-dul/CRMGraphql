const User = require('../models/User')
const Product = require('../models/Product')
const Customer = require('../models/Customer')
const Order = require('../models/Order')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const createToken = ({ id, name, lastName, email }, secret, expiresIn) => {
    return jwt.sign({ id, name, lastName, email }, secret, { expiresIn })
}

const resolvers = {
    Query: {
        getUser: async(_, {}, ctx) => {
            return ctx.user
        },
        getAllProducts: async() => {
            try {
                return await Product.find({})
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        },
        getProduct: async(_, { id }) => {
            const product = await Product.findById(id)
            if(!product){
                throw new Error('The product doesnt exist')
            }
            return product
        },
        getAllCustomers: async() => {
            try {
                const customers = await Customer.find({});
                return customers
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        },
        getCustomerSellers: async(_,{}, ctx) => {
            try {
                const customers = await Customer.find({ seller: ctx.user.id.toString()});
                return customers
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        },
        getCustomer: async(_, { id }, ctx) => {
            const customer = await Customer.findById(id)
            if(!customer){
                throw new Error('The customer does not exist')
            }
            if(customer.seller.toString() !== ctx.user.id){
                throw new Error('You dont have permissions')
            }
            return customer
        },
        getAllOrders: async() => {
            try {
                const orders = await Order.find({})
                return orders
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        },
        getOrderByCustomer: async(_, {}, ctx) => {
            try {
                const orders = await Order.find({ seller: ctx.user.id }).populate('customer')
                return orders
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        },
        getOrder: async(_, { id }, ctx) => {
            const order = await Order.findById(id)
            if(!order) {
                throw new Error('Order not found')
            }
            if(order.seller.toString() !== ctx.user.id){
                throw new Error('You dont have permissions')
            }
            return order
        },
        getOrdersByState: async(_, { state }, ctx) => {
            const orders = await Order.find({ seller: ctx.user.id, state })
            return orders

        },
        getBestCustomers: async() => {
            const customers = await Order.aggregate([
                { $match: { state: 'COMPLETED' } },
                { $group: {
                    _id: "$customer",
                    total: {
                        $sum: '$total'
                    }
                }},
                {
                    $lookup: {
                        from: 'customers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },
                {
                    $limit: 10,
                },{
                    $sort: { total: -1}
                }
            ])
            return customers
        },
        getBestSellers: async() => {
            console.log('startiiiiiiiing')
            const sellers = await Order.aggregate([
                { $match: { state: 'COMPLETED'} },
                { $group: {
                    _id: '$seller',
                    total: {
                        $sum: '$total'
                    }
                }},
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'seller'
                    }
                },
                {
                    $limit: 3,
                },{
                    $sort: {
                        total: -1
                    }
                }
            ])
            return sellers
        },
        searchForProduct: async (_, { text }) => {
            const products = await Product.find({
                $text: {
                    $search: text
                }
            }).limit(10)
            return products
        }
    },
    Mutation: {
        newUser: async(_, { input }) => {
            const { email, password } = input
            const existUser = await User.find({ email })
            if(existUser.length > 0) {
                throw new Error('The user is registered')
            }
            const salt = await bcryptjs.genSalt(10)
            input.password = await bcryptjs.hash(password, salt)
            try {
                const user = new User(input)
                await user.save()
                return user
            } catch (error) {
                console.log(error)
            }
        },
        authUser: async(_, { input }) => {
            const { email, password } = input
            const existUser = await User.findOne({ email })
            if(!existUser){
                throw new Error('This user is not registered')
            }
            const correctPass = await bcryptjs.compare(password, existUser.password)
            if(!correctPass) {
                throw new Error('the credentials don’t match')
            }
            return {
                token: createToken(existUser, process.env.SECRET_WORD, '24h')
            }
        },
        newProduct: async(_, { input }) => {
            try {
                const product = new Product(input)
                const res = await product.save();
                return res
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        },
        updateProduct: async(_, { id, input}) => {
            let updateProduct = await Product.findById(id)
            if(!updateProduct){
                throw new Error('The product doesnt exist')
            }
            updateProduct = await Product.findOneAndUpdate({ _id: id},input, { new: true })
            return updateProduct
        },
        removeProduct: async(_, { id }) => {
            let removeProduct = await Product.findById(id)
            if(!removeProduct){
                throw new Error('The product doesnt exist')
            }
            await Product.findOneAndDelete({_id: id})
            return "The product was removed"
        },
        addNewCustomer: async(_, { input }, ctx) => {
            const { email } = input
            const customer = await Customer.findOne({ email })
            if(customer) {
                throw new Error('There is a user with that email')
            }
            const newCustomer = new Customer(input)
            newCustomer.seller = ctx.user.id
            try {
                const res = await newCustomer.save()
                return res
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        },
        updateCustomer: async(_, { id, input }, ctx) => {
            console.log(input)
            let customer = await Customer.findById(id)
            if(!customer){
                throw new Error("The customer doesn't exists")
            }
            if(customer.seller.toString() !== ctx.user.id){
                throw new Error('You dont have permissions')
            }
            customer = await Customer.findOneAndUpdate({ _id: id}, input, { new : true })
            return customer
        },
        deleteCustomer: async(_, { id }, ctx) => {
            let customer = await Customer.findById(id)
            if(!customer){
                throw new Error("The customer doesn't exists")
            }
            if(customer.seller.toString() !== ctx.user.id){
                throw new Error('You dont have permissions')
            }
            await Customer.findOneAndDelete({ _id: id })
            return `The customer ${customer.name} ${customer.lastName} was removed`
        },
        newOrder: async(_, { input }, ctx) => {
            const { customer } = input
            let existCustomer = await Customer.findById(customer)
            if(!existCustomer){
                throw new Error('The customer is not register')
            }
            if(existCustomer.seller.toString() !== ctx.user.id){
                throw new Error('You dont have permissions')
            }
            for await (const o of input.order){
                const { id } = o
                const product = await Product.findById(id)
                if(o.quantity > product.stock) {
                    throw new Error(`There is insufficient stock for the product ${product.name}`)
                } else {
                    product.stock = product.stock - o.quantity
                    await product.save()
                }
            }
            const newOrder = new Order(input)
            newOrder.seller = ctx.user.id
            const res = await newOrder.save()
            return res
        },
        updateOrder: async(_, { id, input }, ctx) => {
            const { customer } = input
            const order = await Order.findById(id)
            if(!order) {
                throw new Error('Order not found')
            }
            const customerExist = await Customer.findById(customer)
            if(!customerExist) {
                throw new Error('Customer not found')
            }
            if(customerExist.seller.toString() !== ctx.user.id){
                throw new Error('You dont have credentials')
            }
            if(input.order) {
                for await (const o of input.order){
                    const { id } = o
                    const product = await Product.findById(id)
                    if(o.quantity > product.stock) {
                        throw new Error(`There is insufficient stock for the product ${product.name}`)
                    } else {
                        product.stock = product.stock - o.quantity
                        await product.save()
                    }
                }
            }
            const result = await Order.findOneAndUpdate({ _id: id }, input, { new: true })
            return result
        },
        removeOrder: async(_, { id }, ctx) => {
            const order = await Order.findById(id)
            if(!order) {
                throw new Error('Order not found')
            }
            if(order.seller.toString() !== ctx.user.id){
                throw new Error('You dont have credentials')
            }
            await Order.findOneAndDelete({_id:id})
            return `The order was removed`
        }
    }
}

module.exports = resolvers
