module.exports = {
  apps: [{
    name: 'robmclaughl.in',
    script: './bin/www'
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'ec2-34-213-64-184.us-west-2.compute.amazonaws.com',
      key: '~/.ssh/USwestUbuntu.pem',
      ref: 'origin/master',
      repo: 'git@github.com:robmclaughliniv/robmclaughl.in.git',
      path: '/home/ubuntu/robmclaughlin',
      'post-deploy': 'npm install && gulp && pm2 startOrRestart ecosystem.config.js'
    }
  }
}
