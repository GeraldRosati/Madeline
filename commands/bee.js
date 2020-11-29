/**
 * Prints out the bee movie script one word at a time.
 */
const fs = require('fs')
const utils = require('../utils')
const config = require('../config.json')
const { Observable, zip, interval } = require('rxjs')
const { take, map, filter } = require('rxjs/operators')

module.exports = {
    name: 'bee',
    description: 'Tell me a story, Madeline',
    usage: '[identifier]',
    args: true,
    argsOptional: true,

    execute(message, args) {
        let observable
        let subscription
        let identifier = ''

        if (args.length > 0) {
            identifier = args[0]
        }

        message.reply(`Your safe word is ${identifier}`)

        // Read in the script.
        fs.readFile(config.bee_movie_script_path, 'utf8', (err, data) => {
            if (err) {
                message.reply('The bee movie script is lost right now, why don\'t you ask me later.')
                return
            }

            const textList = data.split(/ +/)
            let i = 0
            observable = new Observable(function subscribe(subscriber) {
                // Emit a word from the script every 2 seconds.
                const intervalId = setInterval(() => {
                    subscriber.next(textList[i++])
                }, 2000)

                // Clear the interval when unsubscribing.
                return function unsubscribe() {
                    clearInterval(intervalId)
                }
            })

            // Send the script one word at a time.
            // Zip to keep time interval consistent.
            subscription = observable.pipe(source => zip(source, interval(2000)), map(([word, number]) => word), take(textList.length))
                .subscribe(word => {
                    message.channel.send(word)
                })
        })

        utils.getBeeIdentifierSubject()
            .pipe(filter(id => {
                console.log(`id in subject = ${id}`)
                console.log(`identifier in subject = ${identifier}`)
                return id === identifier || id === 'all'
            }))
            .subscribe(word => subscription.unsubscribe())
    }
}
