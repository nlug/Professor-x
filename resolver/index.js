import Xmen from '../models/xmen'
export default {
    Query: {
        Xmens () {
            return Xmen.find().lean()
        },
        Xmen (obj, {UID}) {
            return Xmen.findOne({UID}).lean()
        }
    },
    Mutation: {
        like (obj, {UID}, context) {
            console.log ("Context", context.req)
            return Xmen.findOne({UID: context.req.UID}).then((_) => {
                const checker = _.like.indexOf(UID);
                if (checker < 0) {
                    _.like.push(UID)
                } else {
                    _.like.splice(checker, 1)
                }
                _.markModified('like')
                return _.save()
            })
        },
        addXmen (obj, {name, avatar}, context) {
            const newXmen = new Xmen({
                name,
                avatar
            })
            return newXmen.save()
        }
    }
}