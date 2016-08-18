chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

# TO DO: WRITE UNIT TESTS.
describe 'lizard-spock', ->
  beforeEach ->
    @robot =
      respond: sinon.spy()
      hear: sinon.spy()

    require('../src/hubot-lizard-spock')(@robot)

###  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/rock/)###
