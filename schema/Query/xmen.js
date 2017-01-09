export default `
type Xmen {
    UID: Int!
    name: String
    avatar: String
    like: [Xmen]
    date: String
    suggest: [Xmen]
}
`