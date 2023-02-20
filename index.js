const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1zdgrcr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});
 



function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send("unauthorized access")
    }
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "forbidden access" })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {

    try {
        const usersCollection = client.db("bicycle").collection("users");
        const itemsCollection = client.db("bicycle").collection("items");


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true }
            const doc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(filter, doc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: "1h" })
            res.send({ result, token })
        })

        app.post('/addItem', verifyJWT, async (req, res) => {
            const query = req.body;
            const result = await itemsCollection.insertOne(query)
            res.send(result)
        })
        // ------------------get all items---------------
        app.get('/allItems', async (req, res) => {
            const query = {}
            const result = await itemsCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/delete/:id', async (req, res) => {
            const id = new ObjectId(req.params.id)
            const filter = { _id: id }
            const result = await itemsCollection.deleteOne(filter)
            res.send(result)
        })

        // ----------------my Items------------------
        app.get('/myItems', verifyJWT, async (req, res) => {
            const supplierEmail = req.query.user;
            const decodedEmail = req.decoded.email;
            if (supplierEmail === decodedEmail) {
                const query = { supplierEmail: supplierEmail }
                const bookings = await itemsCollection.find(query).toArray()
                res.send(bookings)
            }
            else {
                return res.status(403).send({ message: "forbidden access" })
            }
        })
        // --------------------------------------------------------

        app.get('/sixItems', async (req, res) => {
            const query = {}
            const result = await itemsCollection.find(query).limit(6).toArray()
            res.send(result)
        })

        app.get('/singleItem/:id', async (req, res) => {
            const id = new ObjectId(req.params.id);
            const query = { _id: id }
            const result = await itemsCollection.findOne(query)
            res.send(result)
        })

        app.patch('/add/:id', async (req, res) => {
            const id = new ObjectId(req.params.id)
            const filter = { _id: id }
            const { quantity } = req.body;
            const doc = {
                $push: {
                    add: {
                        $each: [quantity],
                    }
                }
            }
            const result = await itemsCollection.updateOne(filter, doc)
            res.send(result)
        })
        app.patch('/remove/:id', async (req, res) => {
            const id = new ObjectId(req.params.id)
            const filter = { _id: id }
            const increase = 1;
            const doc = {
                $push: {
                    remove: {
                        $each: [increase],
                    }
                }
            }
            const result = await itemsCollection.updateOne(filter, doc)
            res.send(result)
        })


    }
    finally {

    }

}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('  duranta warehouse')
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})