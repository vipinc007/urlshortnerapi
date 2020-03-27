const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { pool } = require("./config");
let db = require("./database.js");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const getUrls = (request, response) => {
  //pool.connect();
  pool.query("SELECT * FROM urls", (error, results) => {
    if (error) {
      throw error;
    }
    //console.log(results);
    // let ret = [];
    // ret["urls"] = results.rows;
    // ret["status"] = "success";
    response.status(200).json(results.rows);
  });
};

const getUrlByID = (request, response) => {
  //pool.connect();
  let ukey = request.params.ukey;
  // console.log(request.params.id);
  pool.query(
    "SELECT * FROM urls where ukey='" + ukey + "'",
    (error, results) => {
      if (error) {
        throw error;
      }
      //console.log(results);
      // let ret = [];
      // ret["urls"] = results.rows;
      // ret["status"] = "success";
      response.status(200).json(results.rows);
    }
  );
};

const addUrl = (request, response) => {
  const { url, ukey } = request.body;
  console.log(request.body);
  pool.query(
    "INSERT INTO urls (url,ukey, createddate) VALUES ($1, $2, current_timestamp)",
    [url, ukey],
    error => {
      if (error) {
        throw error;
      }
      //response.status(500).json({ status: "success", message: "Book added." });
      response.status(201).json({ status: "success", message: "Book added." });
    }
  );
};

const addUrlStatistics = (request, response) => {
  const { urlid, ipaddress } = request.body;
  console.log(request.body);
  pool.query(
    "INSERT INTO urlstatistics (urlsid,ipaddress, accesseddate) VALUES ($1, $2, current_timestamp)",
    [urlid, ipaddress],
    error => {
      if (error) {
        throw error;
      }
      //response.status(500).json({ status: "success", message: "Book added." });
      response.status(201).json({ status: "success", message: "Book added." });
    }
  );
};

async function getResult(sql, cnt) {
  let records = [];
  try {
    records = await pool.query(sql);
    return { rows: records.rows, cnt: cnt };
  } catch (error) {
    // handle error
    // do not throw anything
  }
}

const getUrlStatistics = (request, response) => {
  //pool.connect();
  let urlid = request.params.urlid;
  var analysis = [];
  let urlsql = "SELECT * from urls where id=" + urlid;

  getResult(urlsql, 0)
    .then(urlrows => {
      analysis = urlrows.rows;

      let sql =
        "SELECT count(*) as access_count,to_char(accesseddate, 'YYYY-MM-DD') as thedate FROM urlstatistics where urlsid=" +
        urlid +
        " group by thedate";
      getResult(sql, 0)
        .then(rows => {
          analysis[0].analysis = rows.rows;

          for (var i = 0; i < analysis[0].analysis.length; i++) {
            let innersql =
              "SELECT * FROM urlstatistics where to_char(accesseddate, 'YYYY-MM-DD') = '" +
              analysis[0].analysis[i].thedate +
              "' and urlsid=" +
              urlid +
              " order by accesseddate desc";
            getResult(innersql, i)
              .then(innerrows => {
                analysis[0].analysis[innerrows.cnt].rows = innerrows.rows;

                if (innerrows.cnt === analysis[0].analysis.length - 1)
                  response.status(200).json(analysis);
              })
              .catch(err => {
                // handle errors
              });
          }
          if (analysis[0].analysis.length === 0)
            response.status(200).json(analysis);
        })
        .catch(err => {
          // handle errors
        });
    })
    .catch(err => {
      // handle errors
    });
};

const getSettings = (request, response) => {
  //pool.connect();
  pool.query("SELECT * FROM urlsettings", (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};

const editSetting = (request, response) => {
  const { ratelimit } = request.body;
  console.log(request.body);
  pool.query("update urlsettings set ratelimit = $1", [ratelimit], error => {
    if (error) {
      throw error;
    }
    //response.status(500).json({ status: "success", message: "Book added." });
    response
      .status(201)
      .json({ status: "success", message: "Settings Updated." });
  });
};

const checkRateLimit = (request, response) => {
  //pool.connect();
  const { urlid, ipaddress } = request.body;
  var settings = [];
  let urlsql = "SELECT * from urlsettings";
  var ratelimit = 0;

  getResult(urlsql, 0)
    .then(urlrows => {
      settings = urlrows.rows;
      ratelimit = settings[0].ratelimit;
      console.log(ratelimit);
      let sql =
        "SELECT  * FROM urlstatistics where urlsid=" +
        urlid +
        " and ipaddress='" +
        ipaddress +
        "' and to_char(accesseddate, 'YYYY-MM-DD') = to_char(now(), 'YYYY-MM-DD')";
      //console.log(sql);
      getResult(sql, 0)
        .then(rows => {
          let nofvisits = rows.rows;
          console.log(nofvisits.length);

          if (nofvisits.length >= ratelimit)
            response.status(200).json({ exceeded: true });
          else response.status(200).json({ exceeded: false });
        })
        .catch(err => {
          // handle errors
        });
    })
    .catch(err => {
      // handle errors
    });
};

app
  .route("/urls")
  // GET endpoint
  .get(getUrls)
  // POST endpoint
  .post(addUrl);

app
  .route("/url/:ukey")
  // GET endpoint
  .get(getUrlByID);

app
  .route("/urlstatistics")
  // POST endpoint
  .post(addUrlStatistics);

app.route("/urlstatistic/:urlid").get(getUrlStatistics);

app
  .route("/settings")
  // GET endpoint
  .get(getSettings)
  // POST endpoint
  .post(editSetting);

app
  .route("/checkratelimit")
  // GET endpoint
  .post(checkRateLimit);

// Start server
app.listen(process.env.PORT || 3002, () => {
  console.log(`Server listening`);
});
