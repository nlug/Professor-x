import Xmen from '../models/xmen'
import {getSameScore} from '../lib'
import {difference,  flatten} from 'lodash'
export default {
    Xmen: {
        like (obj, args, context, info) {
            return obj.like.map((UID) => Xmen.findOne({UID}))
        },
        suggest (obj, args, context, info) {
            return Xmen.find({UID: {$nin: [obj.UID]}}).lean().then ((others) => {
                return flatten(
                    others
                    .map((aXmen) => {
                        aXmen.score = getSameScore(obj.like, aXmen.like)
                        console.log (aXmen)
                        console.log ("Score ", aXmen.score)
                        return aXmen
                    })
                    .filter((aXmen) => aXmen.score > 0.2 )
                    .map((aXmen) => {
                        console.log (aXmen)
                        let listSuggest = difference(aXmen.like, obj.like).filter((_) => _.UID != obj.UID)
                        console.log (`${aXmen.name} suggests ${listSuggest}`)
                        return listSuggest
                    })
                )
            }).then((suggest) => {
                console.log (suggest)
                return Xmen.find({UID: {$in: suggest}}).lean()
            })
        }
    }
}