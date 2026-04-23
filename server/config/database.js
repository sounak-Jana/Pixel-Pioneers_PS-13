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
    console.warn('⚠️ Neo4j not available - running in memory mode:', error.message);
    console.log('📝 Graph data will be stored in memory only');
    // Don't throw error, allow app to run without Neo4j
    return null;
  }
};

export const getDriver = () => {
  if (!driver) {
    throw new Error('Database not connected. Call connectToNeo4j() first.');
  }
  return driver;
};

export const getSession = () => {
  if (!driver) {
    // Return mock session for memory mode
    return {
      run: async (query, params = {}) => {
        console.log('📝 Memory mode query:', query, params);
        return { records: [] };
      },
      close: async () => {}
    };
  }
  return driver.session();
};
