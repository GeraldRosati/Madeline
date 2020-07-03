/**
 * Staff command
 */
const Discord = require('discord.js');
const fetch = require("node-fetch");

module.exports = {
    name: 'staff',
    description: 'Search for staff',
    args: true,
    argsOptional: false,
    usage: "<staff to search for>",

    execute(message, args) {
        // Anilist query
        var query = `
        query ($name: String) {
            Staff(search:$name) {
                name {
                    full
                    native
                }
                siteUrl
                description
                image {
                    large
                }
                characters(sort: FAVOURITES_DESC) {
                    edges {
                        id
                        node {
                            id
                            name {
                                full
                            }
                            media(sort: POPULARITY_DESC) {
                                nodes {
                                    title {
                                        romaji
                                    }
                                    siteUrl
                                }
                            }
                            siteUrl
                        }
                    }
                }
            }
        }
        `;

        // Anilist query variables
        var variables = {
            name: args.join(" "),
        };
        
        // Anilist query url
        var url = 'https://graphql.anilist.co',
            options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    variables: variables
                })
            };
        
        fetch(url, options)
            .then(response => response.json().then(json => response.ok ? json : Promise.reject(json)))
            .then(data => {
                console.log(JSON.stringify(data, null, 3));
                const staff = data.data.Staff;
                let desc = staff.description;
                let characters = staff.characters.edges;

                const embed = new Discord.MessageEmbed()
                    .setTitle(`${staff.name.full} ( ${staff.name.native} )`)
                    .setURL(staff.siteUrl)
                    .setThumbnail(staff.image.large);

                // Limit the description to 2048 characters if there's a description.
                if (desc && desc.length > 2048) {
                    desc = desc.slice(0, 2045) + "...";
                    embed.setDescription(desc.replace(/(<([^>]+)>)/g, ""));
                }

                // If the staff has played any character roles, add those to the embed.
                if (characters.length) {
                    let roles = characters.slice(0, 5) 
                        .flatMap(edge => `[${edge.node.name.full}](${edge.node.siteUrl}) | [${edge.node.media.nodes[0].title.romaji}](${edge.node.media.nodes[0].siteUrl})`)
                        .join("\n");

                    embed.addFields(
                        {name: 'Roles', value: roles, inline: true},          
                    );
                }
                message.channel.send(embed);
            }).catch(error => console.error(error));
    },
};
