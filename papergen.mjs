import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import npath from 'path'

// Alphanum string to randomize the search
const alphanum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Topics used in search queries
const topics = [
    'mathematics',
    'biology',
    'physics',
    'computing',
    'space',
    'technology',
];

// Paper structure
let paper = {
    id: null,
    title: null,
    authors: ["PaperGen", "Danny"],
    topic: null,
    summary: null,
    tags: ["Tag1", "Tag2", "Tag3"],
    content: null,
};

/**
 * Generates a random paper by fetching some data from Wiki
 * @param {*} contentLen 
 * @returns filled Paper object
 */
async function genPaper(contentLen = 200) {
    paper.id = uuidv4();
    // Generate a random topic
    let topic = topics[rnd(0, 5)];
    paper.topic = topic[0].toUpperCase() + topic.slice(1);

    /**
     * Get the title of the randomly selected article,
     * picked by specifying topic and searching the Wiki
     */
    paper.title = await axios.get(encodeURI(`https://en.wikipedia.org/w/api.php?format=json&action=query&list=search&formatversion=latest&srlimit=100&srsearch=${alphanum[rnd(0, alphanum.length)]} articletopic:${topic}`))
        .then((response) => {
            return response.data?.query?.search[rnd(0, 99)].title;
        });
    if (!paper.title) throw new Error('Failed to set the title!');

    /**
     * Gets the content on the page
     */
    paper.content = await axios.get(encodeURI(`https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=${paper.title}&explaintext=1&formatversion=2`))
        .then((response) => {
            return response.data?.query?.pages[0].extract;
        });
    if (!paper.content) throw new Error('Failed to set the contents!');
    paper.summary = paper.content.substr(0, paper.content.indexOf('.'));
    paper.content = paper.content.length > contentLen ? paper.content.slice(0, contentLen) : paper.content;

    return paper;
}

function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function writeJSON(path, object, spacing = 2) {
    if (!object) return console.log([`[WRITE]: Object is not specified!`]);
    if (!path) path = './fakepapers/paper';
    if (!fs.existsSync(npath.dirname(path))) fs.mkdir(npath.dirname(path), (error) => {
        if (error) return console.log(`[MKDIR]: ${error}`);
    });

    fs.writeFile(path + '.json', JSON.stringify(object, null, spacing), (error) => {
        if (error) {
            console.log(`[WRITE]: ${error}`);
        }
    });
}

async function generate(dir, numOfPapers, contentLen) {
    let result, actuallyWrote = 0;
    for (let i = 1; i <= numOfPapers; i++) {
        result = await genPaper(contentLen).catch((error) => {
            console.log(`[GENERATOR]: ${error}`);
        });
        if (!result) continue;

        writeJSON(npath.resolve(dir, result.topic + '_' + result.id.slice(0, 3)), result, 2);
        actuallyWrote++;
        console.log(`Wrote file #${i}`);
    }

    console.log(`[GENERATOR]: Finished generating. | Produced ${actuallyWrote} / ${numOfPapers}`);
}

generate('./papers', 10, 2);