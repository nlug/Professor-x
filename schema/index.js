import Xmen from './Query/xmen'
const schema = `
type Query {
    Xmens: [Xmen]
    Xmen(UID: Int): Xmen
}
schema {
    query: Query
}
`
export default () => [Xmen, schema]