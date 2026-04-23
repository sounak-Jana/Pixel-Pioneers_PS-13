import neo4j from 'neo4j-driver';

let driver = null;

export const connectToNeo4j = async () => {
  try {
    const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    // Test the connection
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    
    console.log('✅ Connected to Neo4j database');
    return driver;
  } catch (error) {
    console.error('❌ Failed to connect to Neo4j:', error);
    throw error;
  }
};

export const getDriver = () => {
  if (!driver) {
    throw new Error('Database not connected. Call connectToNeo4j() first.');
  }
  return driver;
};

export const getSession = () => {
  const driver = getDriver();
  return driver.session();
};
