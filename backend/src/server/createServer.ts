import 'reflect-metadata'

import log4js from 'log4js'

import { ApolloServer } from 'apollo-server-express'
import express, { Express } from 'express'

// database
import connection from '@/typeorm/connection'
import { checkDBVersion } from '@/typeorm/DBVersion'

// server
import cors from './cors'
import serverContext from './context'
import plugins from './plugins'

// config
import CONFIG from '@/config'

// graphql
import schema from '@/graphql/schema'

// webhooks
import { elopageWebhook } from '@/webhook/elopage'
import { Connection } from '@dbTools/typeorm'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

type ServerDef = { apollo: ApolloServer; app: Express; con: Connection }

log4js.configure(CONFIG.LOG4JS_CONFIG)

const logger = log4js.getLogger('backend')
logger.debug('This little thing went to market')
logger.info('This little thing stayed at home')
logger.error('This little thing had roast beef')
logger.fatal('This little thing had none')
logger.trace('and this little thing went wee, wee, wee, all the way home.')


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createServer = async (context: any = serverContext): Promise<ServerDef> => {
  // open mysql connection
  const con = await connection()
  if (!con || !con.isConnected) {
    throw new Error(`Fatal: Couldn't open connection to database`)
  }

  // check for correct database version
  const dbVersion = await checkDBVersion(CONFIG.DB_VERSION)
  if (!dbVersion) {
    throw new Error('Fatal: Database Version incorrect')
  }

  // Express Server
  const app = express()

  // cors
  app.use(cors)

  // bodyparser json
  app.use(express.json())
  // bodyparser urlencoded for elopage
  app.use(express.urlencoded({ extended: true }))

  // Elopage Webhook
  app.post('/hook/elopage/' + CONFIG.WEBHOOK_ELOPAGE_SECRET, elopageWebhook)

  // Apollo Server
  const apollo = new ApolloServer({
    schema: await schema(),
    playground: CONFIG.GRAPHIQL,
    introspection: CONFIG.GRAPHIQL,
    context,
    plugins,
    logger,
  })
  apollo.applyMiddleware({ app, path: '/' })
  return { apollo, app, con }
}

export default createServer
