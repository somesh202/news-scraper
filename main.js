const https = require("https");
const http = require("http");

// Function to process links extracted from HTML content
const linkData = (links) => {
  return links.map((element) => {
    // Extracting the link from HTML attribute
    let f = element.replace('href="', "");
    let s = f.replace('">', "");
    // Appending the domain to the link
    return "https://time.com" + s;
  });
};

// Function to process stories extracted from HTML content
const storiesData = (stories) => {
  return stories.map((element) => {
    // Removing HTML tags and extract the story title
    let f = element.replace('line">', "");
    let s = f.replace("</h3>", "");
    let t = s.replace(/<(.*?)>/g, "");
    return t;
  });
};

// Function to extract relevant content from HTML data
const extractContent = (data) => {
  // Cleaning up the HTML data
  let processData = data.replace(/\n/g, "");
  processData = processData.replace(/[t ]+\</g, "<");
  processData = processData.replace(/\>[\t ]+\</g, "><");
  processData = processData.replace(/\>[\t ]+$/g, ">");

  // Extracting the section containing latest stories
  let processDataobj = processData.match(/Latest Stories(.*?)<\/ul>/);
  processData = processDataobj[0];

  // Extracting links and stories from the processed data
  let links = processData.match(/href="(.*?)>/g);
  let stories = processData.match(/line">(.*?)h3>/g);

  // Processing links and stories
  const processedLink = linkData(links);
  const processTitle = storiesData(stories);

  // Preparing resultant array containing stories with links
  let finalStoriesArray = [];

  // Iterating over processed data and create story objects
  for (let i = 0; i < 6; i++) {
    let storyObject = {};
    storyObject["title"] = processTitle[i];
    storyObject["link"] = processedLink[i];

    finalStoriesArray.push(storyObject);
  }
  return finalStoriesArray;
};

// Function to fetch data from time.com
const getData = () => {
  return new Promise((resolve, reject) => {
    https
      .request(
        {
          host: "time.com",
          path: "/",
          method: "GET",
        },
        (res) => {
          let str = "";
          // Collect data chunks as they arrive
          res.on("data", (d) => {
            let data = d.toString();
            str += data;
          });
          // Resolve the promise when all data is received
          res.on("end", () => {
            resolve(str);
          });
          // Handle errors
          res.on("error", (error) => {
            reject(error);
          });
        }
      )
      .end();
  });
};

// Function to get the latest news from time.com and start a local server to serve the data
const getNews = async () => {
  try {
    // Fetch HTML data from time.com
    const data = await getData();
    // Extract relevant content from HTML data
    const finalData = extractContent(data);
    // Configure local server
    const host = "localhost";
    const port = 8000;
    // Create request listener for local server
    const requestListener = function (req, res) {
      res.writeHead(200, { "Content-Type": "text/json" });
      // Serve the latest stories when requested
      if (req.url === "/getTimeStories") {
        res.end(JSON.stringify(finalData));
      }
    };
    // Create local server
    const server = http.createServer(requestListener);
    // Start local server
    server.listen(port, host, () => {
      console.log(
        `Click on the above link http://${host}:${port}/getTimeStories`
      );
    });
  } catch (error) {
    // Handle errors occurred during fetching or processing data
    console.error("Error occurred while getting latest news:", error);
  }
};

// Call the function to start fetching latest news and serving it through a local server
getNews();
