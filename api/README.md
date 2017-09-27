# Database
* See the [Webhooks listener README](../layer-webhooks-listener/README.md#database) for basic database setup
* `conversations` [table schema](../layer-webhooks-listener/migrations/create_conversations.sql). We can change this if necessary
* This repo has been configured with the `pg` package and native bindings

# Project overview
* This project uses [Koa](http://koajs.com), which works really well with [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* Conceptually, Promises are like a callback function itself — you return the function/object, and _the system_ will take care of actually calling that function when the async thing you want to do is done
* Promises are created like this: `new Promise(function(resolve, reject) { /* Your code */ })`. Note that both `resolve` and `reject` are functions — promises are created with a function that takes two functions as arguments. Call the `resolve` function with the results of a successful async result, or the `reject` function with an error:

```
new Promise((resolve, reject) => {  // Shorter "fat-arrow" function syntax, works the same in this case
  db.query('blah', (error, response) => {  // Callback function
    if (error)
      reject(error)
    else
      resolve(response)
  })
})
```
* Koa allows you to use promises like synchronous functions:

```
get('/blah', function *(next) {
  // `this.body` refers to the response body that will be sent out
  this.body = yield functionThatReturnsAPromise();
})
```

* `index.js` handles the routing and imports modules from `src/`. Each module should export a promise-returning function, which `index.js` will use.