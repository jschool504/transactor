import EventService from "./event-service"

const assert = require('assert')
const sinon = require('sinon')

describe.skip('EventService', () => {
  let eventRepositoryMock, eventHandlerRegistryMock, eventService
  const env = 'test'

  beforeEach(() => {
    eventRepositoryMock = {
      insert: sinon.stub(),
      unprocessed: sinon.stub(),
      markAsProcessed: sinon.stub(),
      markAsTried: sinon.stub(),
    }
    eventHandlerRegistryMock = {
      [env]: {
        topicHandler: sinon.stub(),
        anotherTopicHandler: sinon.stub(),
      },
    }
    eventService = new EventService({ env, eventRepository: eventRepositoryMock, eventHandlerRegistry: eventHandlerRegistryMock })
  })

  describe('publish', () => {
    it('should insert a new unprocessed event', async () => {
      const event = { topic: 'topic', message: 'message' }
      eventRepositoryMock.insert.resolves()

      await eventService.publish(event)

      sinon.assert.calledOnce(eventRepositoryMock.insert)
      sinon.assert.calledWithExactly(eventRepositoryMock.insert, { ...event, processed: false })
    })
  })

  describe('process', () => {
    it('should process unprocessed events', async () => {
      const unprocessedEvents = [{ id: '1', topic: 'topic', message: 'message', processed: false }]
      eventRepositoryMock.unprocessed.resolves(unprocessedEvents)
      eventHandlerRegistryMock[env]['topic'].resolves({ processed: true, error: null })
      eventRepositoryMock.markAsProcessed.resolves()

      await eventService.process()

      sinon.assert.calledOnce(eventRepositoryMock.unprocessed)
      sinon.assert.calledWithExactly(eventRepositoryMock.markAsProcessed, unprocessedEvents[0])
    })

    it('should not process events that have no registered handler', async () => {
      const unprocessedEvents = [{ id: '1', topic: 'unknown-topic', message: 'message', processed: false }]
      eventRepositoryMock.unprocessed.resolves(unprocessedEvents)

      await eventService.process()

      sinon.assert.notCalled(eventRepositoryMock.markAsProcessed)
      sinon.assert.notCalled(eventRepositoryMock.markAsTried)
    })

    it('should not process events that are unsuccessfully handled', async () => {
      const unprocessedEvents = [{ id: '1', topic: 'topic', message: 'message', processed: false }]
      eventRepositoryMock.unprocessed.resolves(unprocessedEvents)
      const error = 'An error occurred'
      eventHandlerRegistryMock[env]['topic'].resolves({ processed: false, error })
      eventRepositoryMock.markAsTried.resolves()

      await eventService.process()

      sinon.assert.calledOnce(eventRepositoryMock.unprocessed)
      sinon.assert.calledWithExactly(eventRepositoryMock.markAsTried, unprocessedEvents[0], error)
      sinon.assert.notCalled(eventRepositoryMock.markAsProcessed)
    })

  })

})
