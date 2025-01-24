require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// database

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b0m9oyj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("donorNetworkDb").collection("users");
    const donationRequestsCollection = client
      .db("donorNetworkDb")
      .collection("donationRequests");

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      const result = await userCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users", async (req, res) => {
      console.log(req.body);
      const { name, image, bloodGroup, districtName, upazilaName } = req.body;
      const email = req.query.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          name,
          image,
          bloodGroup,
          districtName,
          upazilaName,
        },
      };

      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // create donation requests api

    app.post("/donation-requests", async (req, res) => {
      const info = req.body;
      const result = await donationRequestsCollection.insertOne(info);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Donor Network is running");
});

app.listen(port, () => {
  console.log(`Donor Network is running on port: ${port}`);
});
