import Xmen from '../models/xmen'
import {getSameScore} from '../lib'
import {difference,  flatten, findIndex, sortBy} from 'lodash'
export default {
    Xmen: {
        like (obj, args, context, info) {
            return obj.like.map((UID) => Xmen.findOne({UID}))
        },
        suggest (obj, args, context, info) {
            return Xmen.find({UID: {$nin: [obj.UID]}}).lean().then ((others) => {
                    return others
                    .map((aXmen) => {
                        aXmen.score = getSameScore(obj.like, aXmen.like)
                        return aXmen
                    })
                    .filter((aXmen) => aXmen.score > 0.2 )
                    .map((aXmen) => {
                        let listSuggest = {
                            score: aXmen.score,
                            suggest: difference(aXmen.like, obj.like).filter((_) => _.UID != obj.UID).filter((_) => _ !== obj.UID)
                        }
                        console.log (`${aXmen.name} suggests ${listSuggest}`)
                        return listSuggest
                    })
                    .reduce((a, listSuggest) => {
                        for (let i = 0; i < listSuggest.suggest.length; i++) {
                            let aXmen = {
                                UID: listSuggest.suggest[i],
                                suggestScore: listSuggest.score
                            }
                            let index = findIndex(a, {UID: aXmen.UID})
                            if (index > -1) {
                                a[index].suggestScore += aXmen.suggestScore
                            } else {
                                a.push(aXmen)
                            }
                        }
                        return a
                    }, [])
            }).then((result) => {
                console.log (result)
                return sortBy(result, ['suggestScore']).reverse()
            }).then((suggest) => {
                return suggest.map((_) => Xmen.findOne({UID: _.UID}).lean())
            })
        }
    }
}