const { ApolloServer } = require('apollo-server')
const typeDefs = require('./graphql/schema')
const resolvers = require('./graphql/resolvers')
const connectedDB = require('./config/db')
const jwt = require('jsonwebtoken')
require('dotenv').config()

connectedDB()
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({req}) => {
        const token = req.headers['authorization'] || ''
        if(token){
            try {
                const user = await jwt.verify(token.replace('Bearer ', ''), process.env.SECRET_WORD)
                return {
                    user
                }
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        }

    }
})

server.listen({port: process.env.PORT || 4000}).then(({ url }) => {
    console.log(`Server ready in ${url}`)
})