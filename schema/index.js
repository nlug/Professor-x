import Xmen from './xmen'
const schema = `
type Query {
    Xmens: [Xmen]
    Xmen(UID: Int): Xmen
}
type Mutation {
    like(UID: Int): Xmen
    addXmen(name: String!, avatar: String!): Xmen
}
schema {
    query: Query
    mutation: Mutation
}
`
export default () => [Xmen, schema]