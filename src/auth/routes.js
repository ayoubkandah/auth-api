'use strict';
const fs = require('fs');
const acl=require("./middleware/acl")
const express = require('express');
const Collection = require('./models/data-collection.js');
const models = new Map();
const authRouter = express.Router();
const User = require('./models/users.js');
const basicAuth = require('./middleware/basic.js')
const bearerAuth = require('./middleware/bearer.js')
const permissions = require('./middleware/acl.js')
//-------ADDEEEEEEEEEEEEEEEEEEED
authRouter.param('model', (req, res, next) => {
  // console.log("-----------------")
  const modelName = req.params.model;
  // console.log(modelName,"--------------")
  if (models.has(modelName)) {
    req.model = models.get(modelName);
    next();
  } else {
    const fileName = `${__dirname}/./models/${modelName}/model.js`;
    if (fs.existsSync(fileName)) {
      const model = require(fileName);
      models.set(modelName, new Collection(model));
      req.model = models.get(modelName);
      next();
    }
    else {
      next("Invalid Model");
    }
  }
});

authRouter.get('/api/v1/:model', handleGetAll);
authRouter.get('/api/v2/:model', bearerAuth,acl("read"), handleGetAll);
authRouter.get('/api/v1/:model/:id', handleGetOne);
authRouter.get('/api/v2/:model/:id', bearerAuth,acl("read"), handleGetOne);
authRouter.post('/api/v1/:model', handleCreate);
authRouter.post('/api/v2/:model', bearerAuth,acl("create"),handleCreate);
authRouter.put('/api/v1/:model/:id', handleUpdate);
authRouter.put('/api/v2/:model/:id',bearerAuth,acl("update"), handleUpdate);
authRouter.patch('/api/v2/:model/:id',bearerAuth,acl("update"), handleUpdate);

authRouter.delete('/api/v1/:model/:id', handleDelete);
authRouter.delete('/api/v2/:model/:id',bearerAuth,acl("delete"), handleDelete);


async function handleGetAll(req, res) {
  console.log("-----AAAAAAAAAAAAAAAAAAAAAA")
  let allRecords = await req.model.get();
  res.status(200).json(allRecords);
}

async function handleGetOne(req, res) {
  const id = req.params.id;
  let theRecord = await req.model.get(id)
  res.status(200).json(theRecord);
}

async function handleCreate(req, res) {
  let obj = req.body;
  let newRecord = await req.model.create(obj);
  res.status(201).json(newRecord);
}

async function handleUpdate(req, res) {
  const id = req.params.id;
  const obj = req.body;
  let updatedRecord = await req.model.update(id, obj)
  res.status(200).json(updatedRecord);
}

async function handleDelete(req, res) {
  let id = req.params.id;
  let deletedRecord = await req.model.delete(id);
  res.status(200).json(deletedRecord);
}
//----//-------ADDEEEEEEEEEEEEEEEEEEED


authRouter.post('/signup', async (req, res, next) => {
  try {
    let user = new User(req.body);
    const userRecord = await user.save();
    const output = {
      user: userRecord,
        token: userRecord.token
    };
    res.status(201).json(output);
  } catch (e) {
    next(e.message)
  }
});

authRouter.post('/signin', basicAuth, (req, res, next) => {
  const user = {
    user: req.user,
    token: req.user.token
  };
  res.status(200).json(user);
});
authRouter.get('/users', bearerAuth, permissions('delete'), async (req, res, next) => {
  const users = await User.find({});
  const list = users.map(user => user.username);
  res.status(200).json(list);
});
authRouter.get('/secret', bearerAuth, async (req, res, next) => {
  res.status(200).send('Welcome to the secret area')
});

module.exports = authRouter;
