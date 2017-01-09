import Xmen from '../models/xmen'
export default {
    Query: {
        Xmens () {
            return Xmen.find().lean()
        },
        Xmen (obj, {UID}) {
            return Xmen.findOne({UID}).lean()
            /*return new Promise((resolve, reject) => 
                Xmen.findOne({UID: UID}).exec((error, data) => {
                    if (error) console.log(error)
                    resolve(data)
                })
            )*/
        }
    }
}