require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
// stripe secret key
const stripe = require("stripe")(process.env.stripe_sk);

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// database

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const blogCollection = client.db("donorNetworkDb").collection("blogs");
    const donationRequestsCollection = client
      .db("donorNetworkDb")
      .collection("donationRequests");
      const donationsCollection = client.db("donorNetworkDb").collection("donations");

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne({...user, role: "donor" });
      res.send(result);
    });

    //  Get all users (for dashboard)
app.get("/all-users", async (req, res) => {
  try {
    const status = req.query.status; // Optional filtering by status
    const query = status ? { status } : {};

    const result = await userCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send({ error: "Internal server error" });
  }
});

    app.patch("/users", async (req, res) => {
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
//users
    app.get("/users", async (req, res) => {
  const email = req.query.email;
  const result = await userCollection.findOne({ email });
  res.send(result);
});


    // create donation requests api

    app.get("/donation-requests", async (req, res) => {
      const status = req.query.status;
      const query = status ? { status } : {};
      const result = await donationRequestsCollection.find(query).toArray();
      res.send(result);
    });



    app.get("/donation-requests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationRequestsCollection.findOne(query);
      res.send(result);
    });

    app.post("/donation-requests", async (req, res) => {
      const info = req.body;
      const result = await donationRequestsCollection.insertOne(info);
      res.send(result);
    });

    //status update to inprogress
    app.patch("/donation-requests/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "inprogress",
        },
      };

      const result = await donationRequestsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    //update donation request
app.patch("/donation-requests/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const result = await donationRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.modifiedCount > 0) {
      res.send({ message: "Updated successfully", success: true });
    } else {
      res.status(404).send({ message: "No document updated", success: false });
    }
  } catch (err) {
    res.status(500).send({ message: "Update failed", error: err.message });
  }
});
;

// Delete donation request
app.delete("/donation-requests/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await donationRequestsCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Error deleting donation request:", error);
    res.status(500).send({ error: "Failed to delete donation request" });
  }
});

    
    // Get donation requests by user email
app.get("/my-donation-requests", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ message: "Email is required" });

  const query = { requesterEmail: email }; // assuming this field exists
  const result = await donationRequestsCollection.find(query).toArray();
  res.send(result);
});

//user block unblock
app.patch("/users/:id/status", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body; // "active" or "blocked"

  try {
    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
    res.send(result);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).send({ error: "Failed to update user status" });
  }
});

// user role update (volunteer or admin)
app.patch("/users/:id/role", async (req, res) => {
  const id = req.params.id;
  const { role } = req.body; // "volunteer" or "admin"

  try {
    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );
    res.send(result);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).send({ error: "Failed to update user role" });
  }
});

// blog apis

//add blog
app.post("/blogs", async (req, res) => {
  const { title, thumbnail, content,  author } = req.body;

  const newBlog = {
    title,
    thumbnail,
    content,
    author,
    status: "draft", // default
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const result = await blogCollection.insertOne(newBlog);
    console.log('Blog created:', result);
    res.send(result);
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).send({ error: "Failed to create blog" });
  }
});
// Get all blogs with status published
app.get("/blogs", async (req, res) => {
  const status = req.query.status;
  const query = status ? { status } : {};

  try {
    const blogs = await blogCollection.find(query).toArray();
    res.send(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).send({ error: "Failed to fetch blogs" });
  }
});


// update blog status

app.patch("/blogs/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, requesterEmail } = req.body; // should be "published" or "draft"

  try {
    // Check role
    const user = await userCollection.findOne({ email: requesterEmail });
    if (!user || user.role !== "admin") {
      return res.status(403).send({ error: "Unauthorized" });
    }

    const result = await blogCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    res.send(result);
  } catch (err) {
    console.error("Error updating blog status:", err);
    res.status(500).send({ error: "Failed to update status" });
  }
});
//blog by id 
app.get("/blogs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await blogCollection.findOne({ _id: new ObjectId(id) });
    if (!blog) {
      return res.status(404).send({ error: "Blog not found" });
    }
    res.send(blog);
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).send({ error: "Failed to fetch blog" });
  }
});

//update blog
app.patch("/blogs/:id", async (req, res) => {
  const { id } = req.params;
  const { title, thumbnail, content, author } = req.body;

  try {
    const result = await blogCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          thumbnail,
          content,
          author,
          updatedAt: new Date(),
        },
      }
    );
    res.send(result);
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).send({ error: "Failed to update blog" });
  }
});
//delete blog
app.delete("/blogs/:id", async (req, res) => {
  const { id } = req.params;
  const { requesterEmail } = req.body;

  try {
    const user = await userCollection.findOne({ email: requesterEmail });
    // if (!user || user.role !== "admin") {
    //   return res.status(403).send({ error: "Unauthorized" });
    // }

    const result = await blogCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).send({ error: "Failed to delete blog" });
  }
});

// Stripe payment intent creation
// Add this near other routes
app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount * 100), // amount in cents
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).send({ error: "Failed to create payment intent" });
  }
});

// Store a donation
app.post("/donations", async (req, res) => {
  const donation = req.body;
  const result = await donationsCollection.insertOne(donation);
  res.send(result);
});

// Get all donations (or filter by email)
app.get("/donations", async (req, res) => {
  const email = req.query.email;
  const query = email ? { email } : {};
  const result = await donationsCollection.find(query).toArray();
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
