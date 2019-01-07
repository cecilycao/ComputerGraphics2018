# CS 5310: Computer Graphics homework starter files

This repository should be cloned and deployed to a GitHub pages site. When you've done this, your site should look like the one here:

https://pages.github.ccs.neu.edu/cecilycao/CS5310-ComputerGraphicsHW-YeCao

## Cloning and deploying the repo on GitHub Pages

Download the repo in zip format, then create a new repo for it under your own NEU GitHub account.

Edit the `_config.yml` file to replace `tmullen` with your own username. 

Follow the instructions [here](https://help.github.com/articles/configuring-a-publishing-source-for-github-pages/) to set up GitHub pages. In the GitHub Pages Source dropdown (in Settings) choose 'master'. 

It may take a few minutes for your website to be generated. Check that the links to the individual exercises are working properly.

Adding, committing, and pushing your changes to the repository will automatically update the GitHub Pages website. 

## Deploying locally

Because of some funkiness in how GitHub pages handles relative links, it's best to serve the local site using Jekyll. Follow the instructions [here](https://jekyllrb.com/docs/installation/) to install Jekyll for your own platform. (If you get a permission error installing for Mac, use `sudo` to execute the installation command).

Once you've installed Jekyll, you can run the server from the project directory with the command

    jekyll serve --baseurl ''

The page should show up at `localhost:4000` in your browser. 

