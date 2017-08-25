'use strict';

const Promise = require('bluebird');
const scrapeIt = require('scrape-it');
const google = require('googleapis');
const customSearch = google.customsearch('v1');

const tclBaseUri = process.env.TCL_BASE_URI;
const tclRandomGifUri = process.env.TCL_RANDOM_GIF_URI;
// You can get a custom search engine id at
// https://www.google.com/cse/create/new
// Add TCL_ at the beginning because of a crazy bug https://github.com/Microsoft/vscode/issues/27139
const CX = process.env.TCL_GOOGLE_CX;
const API_KEY = process.env.TCL_GOOGLE_API_KEY;

class TCL {

  // Gets a random page from TCL
  random() {
    return this.scrapeTclPage(tclRandomGifUri);
  }

  // Searches for the searchText in TCL site in Google and returns a random result 
  search(searchText) {

    if (searchText.trim() === '') return this.random();

    var that = this;

    return new Promise((resolve, reject) => {
      customSearch.cse.list({ cx: CX, q: searchText, auth: API_KEY }, function (err, resp) {
          if (err){
            reject(err);
            return;
          }

          if (resp.items && resp.items.length > 0) {
            let randomIndex = that.getRandomInt(0, resp.items.length);
            resolve(that.scrapeTclPage(resp.items[randomIndex].link));
          } else {
            // This response will be visible only for the user that called the command
            resolve({ text: 'Sorry, no results for that :('});
          }
      });
    }); 
  }

  scrapeTclPage(url){
    return scrapeIt(url, {
      title: "#post1 h3",
      gif: {
        selector: "#post1 img",
        attr: "src"
      },
      by: "#post1 i"
    })
      .then((page) => {
        // console.log(page);

        let rval = {
          "response_type": "in_channel", // Response visible to the whole channel
          "text": page.by,
          "attachments": [{
            "text": page.title,
            "image_url": page.gif
          }]
        };

        return rval;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  // Retorna un entero aleatorio entre min (incluido) y max (excluido)
  // ¡Usando Math.round() te dará una distribución no-uniforme!
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

}

module.exports = new TCL();
