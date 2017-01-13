export default `
# Thông tin chi tiết về một **Xmen**
type Xmen {
    UID: Int!
    name: String
    # URl tới Avatar
    avatar: String
    # Danh sách những thằng Xmen đã Like
    like: [Xmen]
    date: String
    # Danh sách Xmen mà hệ thống gợi ý có thể thằng này muốn... chung sống
    suggest: [Xmen]
}
input XmenInput {
    name: String!
    avatar: String!
}
`