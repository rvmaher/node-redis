const express = require("express");
const redis = require("redis");
const { PORT, REDIS_PORT, PHOTO_URL } = require("./config");

const app = express();
const client = redis.createClient(REDIS_PORT);

client.on("connect", () => console.log("redis connected"));

const initRedis = async () => {
  await client.connect();
};

const getOrSetCache = async (key, cb) => {
  return new Promise(async (resolve) => {
    const photo = await client.get(key);
    if (photo != null) {
      resolve(JSON.parse(photo));
    } else {
      const response = await cb();
      client.setEx(key, 1000, JSON.stringify(response));
      resolve(response);
    }
  });
};

const getPhoto = async (req, res) => {
  const { id } = req.params;
  const photo = await getOrSetCache(id, async () => {
    try {
      const response = await fetch(`${PHOTO_URL}/${id}`);
      const data = await response.json();
      return data;
    } catch {
      return res.status(500).send({ message: "something went wrong" });
    }
  });
  res.send(photo);
};

app.use("/photo/:id", getPhoto);

app.listen(PORT, () => {
  console.log(`server started at port ${PORT}`);
  initRedis();
});
