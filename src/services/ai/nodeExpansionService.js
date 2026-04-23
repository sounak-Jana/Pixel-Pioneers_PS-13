import axios from 'axios';
import entityExtractionService from './entityExtractionService.js';
import graphService from '../api/graphService.js';

class NodeExpansionService {
  constructor() {
    this.apiBase = 'http://localhost:3001/api/ai';
    this.expansionStrategies = {
      SEMANTIC: 'semantic',
      STRUCTURAL: 'structural',
      COLLABORATIVE: 'collaborative',
      TEMPORAL: 'temporal',
      CONTEXTUAL: 'contextual'
    };
  }

  // Expand a node with AI-generated content
  async expandNode(nodeId, strategy = this.expansionStrategies.SEMANTIC) {
    try {
      const response = await axios.post(`${this.apiBase}/expand-node/${nodeId}`, {
        strategy
      });
      return response.data;
    } catch (error) {
      console.error('Error expanding node:', error);
      throw error;
    }
  }

  // Generate related concepts and connections
  async generateRelatedConcepts(node, existingNodes = []) {
    try {
      const response = await axios.post(`${this.apiBase}/suggest-connections`, {
        nodeId: node.id,
        context: {
          nodeLabel: node.data.label,
          nodeType: node.data.type,
          description: node.data.properties?.description || '',
          existingConcepts: existingNodes.map(n => n.data.label)
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating related concepts:', error);
      throw error;
    }
  }

  // Analyze node content and suggest expansions
  async analyzeNodeForExpansion(node, graphContext = {}) {
    const expansions = {
      subConcepts: [],
      examples: [],
      applications: [],
      questions: [],
      relatedTopics: [],
      contradictions: []
    };

    // Extract content from node
    const content = node.data.properties?.description || node.data.label;
    
    if (!content) {
      return expansions;
    }

    // Use entity extraction to find expansion opportunities
    const entities = await entityExtractionService.extractEntities(content);
    
    // Process extracted entities into expansion suggestions
    expansions.subConcepts = this.identifySubConcepts(node, entities, graphContext);
    expansions.examples = this.identifyExamples(node, entities, graphContext);
    expansions.applications = this.identifyApplications(node, entities, graphContext);
    expansions.questions = this.identifyQuestions(node, entities, graphContext);
    expansions.relatedTopics = this.identifyRelatedTopics(node, entities, graphContext);
    expansions.contradictions = this.identifyContradictions(node, entities, graphContext);

    return expansions;
  }

  identifySubConcepts(node, entities, graphContext) {
    const subConcepts = [];
    
    // Look for definitions and hierarchical relationships
    if (entities.definitions) {
      entities.definitions.forEach(def => {
        if (def.term && def.term !== node.data.label) {
          subConcepts.push({
            label: def.term,
            type: 'concept',
            relationship: 'part_of',
            confidence: def.confidence || 0.7,
            description: def.definition,
            source: 'definition_extraction'
          });
        }
      });
    }

    // Look for compound terms and phrases
    const content = node.data.properties?.description || '';
    const compoundTerms = this.extractCompoundTerms(content, node.data.label);
    
    compoundTerms.forEach(term => {
      subConcepts.push({
        label: term,
        type: 'concept',
        relationship: 'part_of',
        confidence: 0.6,
        description: `Sub-concept of ${node.data.label}`,
        source: 'compound_term_analysis'
      });
    });

    return this.deduplicateSuggestions(subConcepts, graphContext);
  }

  identifyExamples(node, entities, graphContext) {
    const examples = [];
    
    // Extract examples from entity analysis
    if (entities.examples) {
      entities.examples.forEach(example => {
        examples.push({
          label: this.generateExampleLabel(example.example),
          type: 'example',
          relationship: 'example_of',
          confidence: example.confidence || 0.8,
          description: example.example,
          source: 'example_extraction'
        });
      });
    }

    // Generate contextual examples based on node type
    const contextualExamples = this.generateContextualExamples(node);
    examples.push(...contextualExamples);

    return this.deduplicateSuggestions(examples, graphContext);
  }

  identifyApplications(node, entities, graphContext) {
    const applications = [];
    
    // Look for application-related content
    const content = node.data.properties?.description || '';
    const applicationKeywords = ['applies to', 'used in', 'application', 'use case', 'practical'];
    
    applicationKeywords.forEach(keyword => {
      const regex = new RegExp(`[^.]*${keyword}[^.]*\\.?`, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        matches.forEach(match => {
          const application = this.extractApplicationFromText(match);
          if (application) {
            applications.push({
              label: application.title,
              type: 'application',
              relationship: 'applies_to',
              confidence: 0.7,
              description: application.description,
              source: 'keyword_extraction'
            });
          }
        });
      }
    });

    return this.deduplicateSuggestions(applications, graphContext);
  }

  identifyQuestions(node, entities, graphContext) {
    const questions = [];
    
    // Extract questions from entity analysis
    if (entities.questions) {
      entities.questions.forEach(question => {
        questions.push({
          label: this.generateQuestionLabel(question.question),
          type: 'question',
          relationship: 'questions',
          confidence: question.confidence || 0.9,
          description: question.question,
          source: 'question_extraction'
        });
      });
    }

    // Generate inferential questions
    const inferentialQuestions = this.generateInferentialQuestions(node);
    questions.push(...inferentialQuestions);

    return this.deduplicateSuggestions(questions, graphContext);
  }

  identifyRelatedTopics(node, entities, graphContext) {
    const relatedTopics = [];
    
    // Extract related concepts from entities
    if (entities.concepts) {
      entities.concepts.forEach(concept => {
        if (concept.term && concept.term !== node.data.label) {
          relatedTopics.push({
            label: concept.term,
            type: 'concept',
            relationship: 'related_to',
            confidence: concept.confidence || 0.6,
            description: concept.context || `Related to ${node.data.label}`,
            source: 'concept_extraction'
          });
        }
      });
    }

    // Find semantic relationships
    const semanticRelations = this.findSemanticRelations(node, graphContext);
    relatedTopics.push(...semanticRelations);

    return this.deduplicateSuggestions(relatedTopics, graphContext);
  }

  identifyContradictions(node, entities, graphContext) {
    const contradictions = [];
    
    // Look for contradictory statements in content
    const content = node.data.properties?.description || '';
    const contradictionPatterns = [
      { pattern: /\bhowever\b/gi, type: 'contrast' },
      { pattern: /\bbut\b/gi, type: 'contrast' },
      { pattern: /\bon the other hand\b/gi, type: 'contrast' },
      { pattern: /\balthough\b/gi, type: 'concession' },
      { pattern: /\bdespite\b/gi, type: 'concession' }
    ];

    contradictionPatterns.forEach(({ pattern, type }) => {
      const matches = content.match(pattern);
      if (matches) {
        contradictions.push({
          label: `Contradiction to ${node.data.label}`,
          type: 'concept',
          relationship: 'contradicts',
          confidence: 0.5,
          description: `Found ${type} pattern in content`,
          source: 'contradiction_pattern'
        });
      }
    });

    return contradictions;
  }

  // Helper methods
  extractCompoundTerms(content, mainTerm) {
    const compoundTerms = [];
    const words = content.split(/\s+/);
    
    // Look for multi-word terms that include the main term
    for (let i = 0; i < words.length - 1; i++) {
      const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
      if (twoWordPhrase.includes(mainTerm) && twoWordPhrase !== mainTerm) {
        compoundTerms.push(twoWordPhrase);
      }
      
      if (i < words.length - 2) {
        const threeWordPhrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (threeWordPhrase.includes(mainTerm) && threeWordPhrase !== mainTerm) {
          compoundTerms.push(threeWordPhrase);
        }
      }
    }
    
    return [...new Set(compoundTerms)];
  }

  generateExampleLabel(exampleText) {
    const words = exampleText.split(/\s+/).slice(0, 5);
    return `Example: ${words.join(' ')}${exampleText.split(/\s+/).length > 5 ? '...' : ''}`;
  }

  generateContextualExamples(node) {
    const examples = [];
    
    switch (node.data.type) {
      case 'concept':
        examples.push({
          label: `Practical example of ${node.data.label}`,
          type: 'example',
          relationship: 'example_of',
          confidence: 0.6,
          description: `A real-world example demonstrating ${node.data.label}`,
          source: 'contextual_generation'
        });
        break;
      
      case 'theory':
        examples.push({
          label: `Case study for ${node.data.label}`,
          type: 'example',
          relationship: 'example_of',
          confidence: 0.7,
          description: `Case study illustrating ${node.data.label}`,
          source: 'contextual_generation'
        });
        break;
    }
    
    return examples;
  }

  extractApplicationFromText(text) {
    const applicationRegex = /(.+?)(?:applies to|used in|application|use case)(.+?)(?:\.|$)/i;
    const match = text.match(applicationRegex);
    
    if (match) {
      return {
        title: match[2].trim(),
        description: match[0].trim()
      };
    }
    
    return null;
  }

  generateQuestionLabel(questionText) {
    const words = questionText.split(/\s+/).slice(0, 6);
    return `${words.join(' ')}${questionText.split(/\s+/).length > 6 ? '...' : ''}`;
  }

  generateInferentialQuestions(node) {
    const questions = [];
    const questionTemplates = [
      `How does ${node.data.label} relate to other concepts?`,
      `What are the implications of ${node.data.label}?`,
      `How can ${node.data.label} be applied in practice?`,
      `What are the limitations of ${node.data.label}?`,
      `How has ${node.data.label} evolved over time?`
    ];

    questionTemplates.forEach((template, index) => {
      questions.push({
        label: template,
        type: 'question',
        relationship: 'questions',
        confidence: 0.5,
        description: template,
        source: 'inferential_generation'
      });
    });

    return questions;
  }

  findSemanticRelations(node, graphContext) {
    const relations = [];
    const existingNodes = graphContext.nodes || [];
    
    // Find nodes with similar labels
    existingNodes.forEach(existingNode => {
      if (existingNode.id !== node.id) {
        const similarity = this.calculateLabelSimilarity(
          node.data.label, 
          existingNode.data.label
        );
        
        if (similarity > 0.6 && similarity < 1.0) {
          relations.push({
            label: existingNode.data.label,
            type: existingNode.data.type,
            relationship: 'related_to',
            confidence: similarity,
            description: `Semantically similar to ${node.data.label}`,
            source: 'semantic_similarity'
          });
        }
      }
    });

    return relations;
  }

  calculateLabelSimilarity(label1, label2) {
    const words1 = new Set(label1.toLowerCase().split(/\s+/));
    const words2 = new Set(label2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  deduplicateSuggestions(suggestions, graphContext) {
    const existingLabels = new Set(
      (graphContext.nodes || []).map(n => n.data.label.toLowerCase())
    );
    
    return suggestions.filter(suggestion => 
      !existingLabels.has(suggestion.label.toLowerCase())
    );
  }

  // Create expansion nodes and edges
  async createExpansionSuggestions(originalNode, expansions, onNodeCreate, onEdgeCreate) {
    const createdNodes = [];
    const createdEdges = [];

    for (const [category, suggestions] of Object.entries(expansions)) {
      for (const suggestion of suggestions.slice(0, 3)) { // Limit to top 3 per category
        // Create new node
        const newNode = {
          id: `node-${Date.now()}-${Math.random()}`,
          type: 'custom',
          position: {
            x: originalNode.position.x + Math.random() * 200 - 100,
            y: originalNode.position.y + Math.random() * 200 - 100
          },
          data: {
            label: suggestion.label,
            type: suggestion.type,
            properties: {
              description: suggestion.description,
              confidence: suggestion.confidence,
              source: suggestion.source,
              expansionCategory: category,
              createdAt: new Date().toISOString()
            }
          }
        };

        // Create edge connecting to original node
        const newEdge = {
          id: `edge-${Date.now()}-${Math.random()}`,
          from: originalNode.id,
          to: newNode.id,
          relationship: suggestion.relationship,
          properties: {
            confidence: suggestion.confidence,
            source: suggestion.source,
            createdAt: new Date().toISOString()
          },
          type: 'custom'
        };

        createdNodes.push(newNode);
        createdEdges.push(newEdge);

        // Execute callbacks if provided
        if (onNodeCreate) onNodeCreate(newNode);
        if (onEdgeCreate) onEdgeCreate(newEdge);
      }
    }

    return {
      nodes: createdNodes,
      edges: createdEdges,
      summary: {
        totalNodes: createdNodes.length,
        totalEdges: createdEdges.length,
        categories: Object.keys(expansions).filter(cat => expansions[cat].length > 0)
      }
    };
  }
}

export const nodeExpansionService = new NodeExpansionService();
export default nodeExpansionService;
