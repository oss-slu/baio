# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Connecting to MongoDB Database

Note: users must request database admin for access

1. Login to MongoDB.

2. Navigate to the "Better Bioinformatics" project.

![alt text](<DocumentationImages/Project.png>)

3. Click the "Connect" button located under the BBIDevCluster.

![alt text](<DocumentationImages/Connect.png>)

4. In the menu, select "MongoDB for VS Code".

![alt text](<DocumentationImages/MongoDB.png>)

5. Copy the connection string located under "Connect to your MongoDB deployment".

![alt text](<DocumentationImages/ConnectionString.png>)

6. Create a .env file in the root directory of the React project.

7. Save the connection sting in the variable "MONGO_URI". Replace `<db_username>` and `<db_password>` with the username and password provided to you by a database admin. 

![alt text](<DocumentationImages/Env.png>)

8. Save the secret key for JWT in the variable "JWT_SECRET" within the .env file. This can be any random string. For example: JWT_SECRET = "2839070519".

## Configuration Details

We have a config.json file within our src directory so that our frontend pages such as login and signup can dynamically access the port on which the backend is running and read and write to the database.

![Alt text](<DocumentationImages/Config.png>)

Within the .env file in the root directory of the React project, save "betterbioinformatics@gmail.com" in the variable "EMAIL_USER". Save the API key provided by an admin in the variable "SENDGRID_API_KEY". These two variables will be needed to successfully receive a password reset link.

![Alt text](<DocumentationImages/resetPassword_configs.png>)

Within the .env file in the root directory of the React project, create the variables: "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", and "SESSION_SECRET". These variables will be needed to successfully signup and login with Google authentication. The "GOOGLE_CLIENT_ID" and "GOOGLE_CLIENT_SECRET" will be provided by an admin. You may store any value in "SESSION_SECRET".

![Alt text](<DocumentationImages/Google_Authentication_Configuration.png>)