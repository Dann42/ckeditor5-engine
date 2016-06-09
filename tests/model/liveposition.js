/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: model */

'use strict';

import Document from '/ckeditor5/engine/model/document.js';
import DocumentFragment from '/ckeditor5/engine/model/documentfragment.js';
import Element from '/ckeditor5/engine/model/element.js';
import Position from '/ckeditor5/engine/model/position.js';
import LivePosition from '/ckeditor5/engine/model/liveposition.js';
import Range from '/ckeditor5/engine/model/range.js';
import CKEditorError from '/ckeditor5/utils/ckeditorerror.js';

describe( 'LivePosition', () => {
	let doc, root, ul, p, li1, li2;

	before( () => {
		doc = new Document();
		root = doc.createRoot( '$root', 'root' );

		li1 = new Element( 'li', [], 'abcdef' );
		li2 = new Element( 'li', [], 'foobar' );
		ul = new Element( 'ul', [], [ li1, li2 ] );
		p = new Element( 'p', [], 'qwerty' );

		root.insertChildren( 0, [ p, ul ] );
	} );

	it( 'should be an instance of Position', () => {
		let live = new LivePosition( root, [ 0 ] );
		live.detach();

		expect( live ).to.be.instanceof( Position );
	} );

	it( 'should throw if given root is not a RootElement', () => {
		expect( () => {
			new LivePosition( new DocumentFragment(), [ 1 ] );
		} ).to.throw( CKEditorError, /liveposition-root-not-rootelement/ );
	} );

	it( 'should listen to a change event of the document that owns this position root', () => {
		sinon.spy( LivePosition.prototype, 'listenTo' );

		let live = new LivePosition( root, [ 0 ] );
		live.detach();

		expect( live.listenTo.calledWith( doc, 'change' ) ).to.be.true;

		LivePosition.prototype.listenTo.restore();
	} );

	it( 'should stop listening when detached', () => {
		sinon.spy( LivePosition.prototype, 'stopListening' );

		let live = new LivePosition( root, [ 0 ] );
		live.detach();

		expect( live.stopListening.called ).to.be.true;

		LivePosition.prototype.stopListening.restore();
	} );

	it( 'createFromPosition should return LivePosition', () => {
		let position = LivePosition.createFromPosition( new Position( root, [ 0 ] ) );
		expect( position ).to.be.instanceof( LivePosition );
		position.detach();
	} );

	it( 'createFromParentAndOffset should return LivePosition', () => {
		let position = LivePosition.createFromParentAndOffset( ul, 0 );
		expect( position ).to.be.instanceof( LivePosition );
		position.detach();
	} );

	it( 'createBefore should return LivePosition', () => {
		let position = LivePosition.createBefore( ul );
		expect( position ).to.be.instanceof( LivePosition );
		position.detach();
	} );

	it( 'createAfter should return LivePosition', () => {
		let position = LivePosition.createAfter( ul );
		expect( position ).to.be.instanceof( LivePosition );
		position.detach();
	} );

	describe( 'should get transformed if', () => {
		let live;

		beforeEach( () => {
			live = new LivePosition( root, [ 1, 4, 6 ] );
		} );

		afterEach( () => {
			live.detach();
		} );

		describe( 'insertion', () => {
			it( 'is in the same parent and closer offset', () => {
				let insertRange = new Range( new Position( root, [ 1, 4, 0 ] ), new Position( root, [ 1, 4, 3 ] ) );

				doc.fire( 'change', 'insert', { range: insertRange }, null );

				expect( live.path ).to.deep.equal( [ 1, 4, 9 ] );
			} );

			it( 'is at the same position and live position is sticking to right side', () => {
				let insertRange = new Range( new Position( root, [ 1, 4, 6 ] ), new Position( root, [ 1, 4, 9 ] ) );

				doc.fire( 'change', 'insert', { range: insertRange }, null );

				expect( live.path ).to.deep.equal( [ 1, 4, 9 ] );
			} );

			it( 'is before a node from the live position path', () => {
				let insertRange = new Range( new Position( root, [ 1, 0 ] ), new Position( root, [ 1, 2 ] ) );

				doc.fire( 'change', 'insert', { range: insertRange }, null );

				expect( live.path ).to.deep.equal( [ 1, 6, 6 ] );
			} );
		} );

		describe( 'range move', () => {
			it( 'is at the same parent and closer offset', () => {
				let moveSource = new Position( root, [ 2 ] );
				let moveRange = new Range( new Position( root, [ 1, 4, 0 ] ), new Position( root, [ 1, 4, 3 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( [ 1, 4, 9 ] );
			} );

			it( 'is at the same position and live position is sticking to right side', () => {
				let moveSource = new Position( root, [ 2 ] );
				let moveRange = new Range( new Position( root, [ 1, 4, 6 ] ), new Position( root, [ 1, 4, 9 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( [ 1, 4, 9 ] );
			} );

			it( 'is at a position before a node from the live position path', () => {
				let moveSource = new Position( root, [ 2 ] );
				let moveRange = new Range( new Position( root, [ 1, 0 ] ), new Position( root, [ 1, 2 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( [ 1, 6, 6 ] );
			} );

			it( 'is from the same parent and closer offset', () => {
				let moveSource = new Position( root, [ 1, 4, 0 ] );
				let moveRange = new Range( new Position( root, [ 2, 0 ] ), new Position( root, [ 2, 4 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( [ 1, 4, 2 ] );
			} );

			it( 'is from a position before a node from the live position path', () => {
				let moveSource = new Position( root, [ 1, 0 ] );
				let moveRange = new Range( new Position( root, [ 2, 0 ] ), new Position( root, [ 2, 4 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( [ 1, 0, 6 ] );
			} );

			it( 'contains live position (same level)', () => {
				let moveSource = new Position( root, [ 1, 4, 4 ] );
				let moveRange = new Range( new Position( root, [ 2, 0 ] ), new Position( root, [ 2, 4 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( [ 2, 2 ] );
			} );

			it( 'contains live position (deep)', () => {
				let moveSource = new Position( root, [ 1, 3 ] );
				let moveRange = new Range( new Position( root, [ 2, 0 ] ), new Position( root, [ 2, 4 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( [ 2, 1, 6 ] );
			} );
		} );
	} );

	describe( 'should not get transformed if', () => {
		let path, otherRoot;

		before( () => {
			path = [ 1, 4, 6 ];
			otherRoot = doc.createRoot( '$root', 'otherRoot' );
		} );

		let live;

		beforeEach( () => {
			live = new LivePosition( root, path );
		} );

		afterEach( () => {
			live.detach();
		} );

		describe( 'insertion', () => {
			it( 'is in the same parent and further offset', () => {
				let insertRange = new Range( new Position( root, [ 1, 4, 7 ] ), new Position( root, [ 1, 4, 9 ] ) );

				doc.fire( 'change', 'insert', { range: insertRange }, null );

				expect( live.path ).to.deep.equal( path );
			} );

			it( 'is at the same position and live position is sticking to left side', () => {
				let live = new LivePosition( root, path, 'STICKS_TO_PREVIOUS' );
				let insertRange = new Range( new Position( root, [ 1, 4, 6 ] ), new Position( root, [ 1, 4, 9 ] ) );

				doc.fire( 'change', 'insert', { range: insertRange }, null );

				expect( live.path ).to.deep.equal( path );

				live.detach();
			} );

			it( 'is after a node from the position path', () => {
				let insertRange = new Range( new Position( root, [ 1, 5 ] ), new Position( root, [ 1, 7 ] ) );

				doc.fire( 'change', 'insert', { range: insertRange }, null );

				expect( live.path ).to.deep.equal( path );
			} );

			it( 'is in different root', () => {
				let insertRange = new Range( new Position( otherRoot, [ 1, 4, 0 ] ), new Position( otherRoot, [ 1, 4, 4 ] ) );

				doc.fire( 'change', 'insert', { range: insertRange }, null );

				expect( live.path ).to.deep.equal( path );
			} );
		} );

		describe( 'range move', () => {
			it( 'is at the same parent and further offset', () => {
				let moveSource = new Position( root, [ 2 ] );
				let moveRange = new Range( new Position( root, [ 1, 4, 7 ] ), new Position( root, [ 1, 4, 9 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( path );
			} );

			it( 'is at the same position and live position is sticking to left side', () => {
				let live = new LivePosition( root, path, 'STICKS_TO_PREVIOUS' );
				let moveSource = new Position( root, [ 2 ] );
				let moveRange = new Range( new Position( root, [ 1, 4, 6 ] ), new Position( root, [ 1, 4, 9 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( path );

				live.detach();
			} );

			it( 'is at a position after a node from the live position path', () => {
				let moveSource = new Position( root, [ 2 ] );
				let moveRange = new Range( new Position( root, [ 1, 5 ] ), new Position( root, [ 1, 7 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( path );
			} );

			it( 'is from the same parent and further offset', () => {
				let moveSource = new Position( root, [ 1, 4, 7 ] );
				let moveRange = new Range( new Position( root, [ 2, 0 ] ), new Position( root, [ 2, 4 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( path );
			} );

			it( 'is from a position after a node from the live position path', () => {
				let moveSource = new Position( root, [ 1, 5 ] );
				let moveRange = new Range( new Position( root, [ 2, 0 ] ), new Position( root, [ 2, 4 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( path );
			} );

			it( 'is to different root', () => {
				let moveSource = new Position( root, [ 2, 0 ] );
				let moveRange = new Range( new Position( otherRoot, [ 1, 0 ] ), new Position( otherRoot, [ 1, 4 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( path );
			} );

			it( 'is from different root', () => {
				let moveSource = new Position( otherRoot, [ 1, 0 ] );
				let moveRange = new Range( new Position( root, [ 2, 0 ] ), new Position( root, [ 2, 4 ] ) );

				let changes = {
					range: moveRange,
					sourcePosition: moveSource
				};
				doc.fire( 'change', 'move', changes, null );

				expect( live.path ).to.deep.equal( path );
			} );
		} );

		it( 'attributes changed', () => {
			let changes = {
				range: new Range( new Position( root, [ 1, 4, 0 ] ), new Position( root, [ 1, 4, 10 ] ) ),
				key: 'foo',
				oldValue: null,
				newValue: 'bar'
			};

			doc.fire( 'change', 'setAttribute', changes, null );

			expect( live.path ).to.deep.equal( path );
		} );
	} );
} );
