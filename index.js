require('dotenv').config();

const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const axios = require("axios"); // Import Axios
const connectToDb = require("./mongodb"); 
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');


const templatepath = path.join(__dirname, 'views');
const publicPath = path.join(__dirname, 'public');

const geolocationApiKey =  process.env.GEOLOCATION_API_KEY;
console.log("Geolocation API Key:", geolocationApiKey);


app.use(express.json());
app.use(express.static(publicPath));
app.set("view engine", "hbs");
app.set("views", templatepath);
app.use(express.urlencoded({ extended: false }));

let LogInCollection;

connectToDb.then(collection => {
    LogInCollection = collection;

    app.listen(3000, () => {
        console.log('Server is running on port http://localhost:3000/');
    });
}).catch(err => {
    console.error('Failed to start server', err);
});

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    try {
        // Debugging line
        console.log("Received data:", req.body);

        const { name, password } = req.body;

        // Validate input
        if (!name || !password) {
            return res.status(400).send("Name and password are required");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare the user data
        const data = {name, password: hashedPassword
        }; 
            // For debugging
        console.log(`Hashed Password: ${hashedPassword}`);
         
        // Insert into the collection
        await LogInCollection.insertOne(data);

         // Fetch geolocation data
        const geolocationData = await getGeolocationData(req);

        // Pass geolocation data to the home page
        res.render("home", { geolocation: geolocationData });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Server Error");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { name, password } = req.body;

        // Find the user
        const user = await LogInCollection.findOne({ name });
        if (!user) {
            return res.status(401).send("Invalid credentials");
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send("Invalid credentials");
        }

        // Fetch geolocation data
        const geolocationData = await getGeolocationData(req);

        // Pass geolocation data to the home page
        res.render("home", { geolocation: geolocationData });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Server Error");
    }
});

app.get("/home", (req, res) => {
    res.render("home");
});

async function getGeolocationData(req) {
    try {
        // You might need to adapt this based on how you're sending location data
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const response = await axios.get(`http://api.openweathermap.org/geo/1.0/zip?zip=94040,us&appid=${geolocationApiKey}`);

        // For debugging
        console.log('Geolocation API response:', response.data);

        return {
            ip,
            country_name: response.data.country,
            city: response.data.name,
            latitude: response.data.lat,
            longitude: response.data.lon
        };
    } catch (error) {
        console.error('Error fetching geolocation data:', error);
        throw new Error('Failed to fetch geolocation data');
    }
}

app.get('/geolocation', async (req, res) => {
    try {
        const geolocationData = await getGeolocationData(req);
        res.json(geolocationData);
    } catch (error) {
        console.error('Error fetching geolocation data:', error);
        res.status(500).json({ error: 'Failed to fetch geolocation data' });
    }
});




app.get('/sitemap.xml', async (req, res) => {
    try {
        const links = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/home', changefreq: 'weekly', priority: 0.8 },
            // Add more URLs here
        ];

        const stream = new SitemapStream({ hostname: 'http://mywebsite.com/' });
        const xmlString = await streamToPromise(Readable.from(links).pipe(stream)).then((data) => data.toString());

        res.header('Content-Type', 'application/xml');
        res.send(xmlString);
    } catch (err) {
        console.error('Error generating sitemap:', err);
        res.status(500).end();
    }
});
app.get("/user/:name", (req, res) => {
    const { name } = req.params;
    res.render("user", { name });
});
const compression = require('compression');
app.use(compression());