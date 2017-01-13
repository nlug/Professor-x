import Xmen from './xmen'
const schema = `
# Các câu lệnh lấy dữ liệu (tương tự method GET trong RestFul API)
type Query {
    # Danh sách các Xmen
    Xmens: [Xmen]
    # Thông tin chi tiết 1 Xmen
    Xmen(UID: Int): Xmen
}
# Các câu lệnh để thêm/sửa dữ liệu (tuơng tự method POST/PUT/DELETE trong RestFul API)
type Mutation {
    # Dùng trong sự kiện Xmen **"thả tim"** một thằng Xmen khác. Thằng Xmen thả tim đang mặc định là Wolverine (UID = 1)
    like(UID: Int): Xmen
    # Thêm một Xmen vào trong data của chúng ta
    addXmen(input: XmenInput!): Xmen
}
schema {
    query: Query
    mutation: Mutation
}
`
export default () => [Xmen, schema]