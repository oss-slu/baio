# Better Bioinformatics React App

This is a bioinformatics tool developed using React for the frontend and MongoDB for the backend. The app helps bioinformatics researchers use APIs effectively by providing real-time API recommendations, detecting errors in code, and suggesting corrective actions.

## Getting Started

These instructions will help you set up and run the application locally for development purposes.

### Prerequisites
Before you begin, ensure you have the following software installed:

- **Node.js** (version 14 or higher)
- **Git**
- **Python** (version 3.10)

### Python Packages
Ensure Python's package manager: Pip is installed. You can check this with "pip --version".
It’s a good practice to use a virtual environment to isolate your project dependencies. You can create and activate a virtual environment. 
Here is the list of required dependencies to install in the activated venv:
- flask
- flask_cors
- transformers
- torch
- axios


### Installing Dependencies

Clone this repository to your local machine:

```bash
git clone https://github.com/oss-slu/Enhancing-Bioinformatics-Research-through-LLM.git
cd Enhancing-Bioinformatics-Research-through-LLM/
```

The root project directory of the application is llm_bioinformatics_research

Install the necessary packages:

```bash
npm install
```

## Connecting to MongoDB Database

### Prerequisites
Make sure you have the necessary permissions to access the database. If you're using MongoDB Atlas, you need to request admin access.

### Steps to Connect to MongoDB

1. Login to MongoDB.

2. Navigate to the "Better Bioinformatics" project.

![alt text](<DocumentationImages/Project.png>)

3. Click the "Connect" button located under the BBIDevCluster.

![alt text](<DocumentationImages/Connect.png>)

4. In the menu, select "MongoDB for VS Code".

![alt text](<DocumentationImages/MongoDB.png>)

5. Copy the connection string located under "Connect to your MongoDB deployment" and save it for reference in the next part. 

![alt text](<DocumentationImages/ConnectionString.png>)


## Environment Variables
You need to configure the following environment variables to run the app correctly. Create a .env file in the root directory of your React project and add the following details:

Add the following environment variables to the `.env` file:

   ```bash
   MONGO_URI = mongodb+srv://<db_username>:<db_password>@bbidevcluster.in9rq.mongodb.net/
   JWT_SECRET = your_random_secret_key
   SENDGRID_API_KEY = your_sendgrid_api_key
   EMAIL_USER = betterbioinformatics@gmail.com
   ```

   Save the connection string from MongoDB in the variable "MONGO_URI". Replace `<db_username>` and `<db_password>` with the username and password provided to you by a database admin. 

   Save the secret key for JWT in the variable "JWT_SECRET" within the .env file. This can be any random string. For example: JWT_SECRET = "2839070519".

   The SENDGRID_API_KEY will be provided to you by a database admin.

   The EMAIL_USER can be copied over as is. 

It should look similar to this:

![alt text](<DocumentationImages/Env.png>)

If you have the application running, save the env file and restart the application for the changes to take effect. 

### Configuration Details

We have a config.json file within our src directory so that our frontend pages such as login and signup can dynamically access the port on which the backend is running and read and write to the database.

![Alt text](<DocumentationImages/Config.png>)

Within the .env file in the root directory of the React project, save "betterbioinformatics@gmail.com" in the variable "EMAIL_USER". Save the API key provided by an admin in the variable "SENDGRID_API_KEY". These two variables will be needed to successfully receive a password reset link.  

![Alt text](<DocumentationImages/resetPassword_configs.png>)

## Running the Application Locally

After setting up your environment variables, you can run the application locally.

Ensure you have navigated to the project directory: llm_bioinformatics_research
Also, verify that you have activated the virtual environment to ensure you have the required dependencies to run the application. 

Run the following command to start the React development server:

```bash
npm start
```

This will launch the app in development mode. You can view it by opening [http://localhost:3000](http://localhost:3000) in your browser. 
The app will automatically reload if you make changes to the source code.
You may also see any lint errors in the console.

## Additional Information

Here are some more commands to interact with the application: 

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