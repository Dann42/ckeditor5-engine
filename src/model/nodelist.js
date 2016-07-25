/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Node from './node.js';
import CKEditorError from '../../utils/ckeditorerror.js';

/**
 * Provides an interface to operate on a list of {@link engine.model.Node nodes}. `NodeList` is used internally
 * in classes like {@link engine.model.Element Element} or {@link engine.model.DocumentFragment DocumentFragment}.
 */
export default class NodeList {
	/**
	 * Creates an empty node list.
	 *
	 * @param {Iterable.<engine.model.Node>} nodes Nodes contained in this node list.
	 */
	constructor( nodes ) {
		/**
		 * Nodes contained in this node list.
		 *
		 * @private
		 * @member {Array.<engine.model.Node>} engine.model.NodeList#_nodes
		 */
		this._nodes = [];

		if ( nodes ) {
			this.insertNodes( 0, nodes );
		}
	}

	/**
	 * Returns an iterator that iterates over all nodes contained inside this node list.
	 *
	 * @returns {Iterator.<engine.model.Node>}
	 */
	[ Symbol.iterator ]() {
		return this._nodes[ Symbol.iterator ]();
	}

	/**
	 * Returns the number of nodes contained inside this node list.
	 *
	 * @returns {Number}
	 */
	get length() {
		return this._nodes.length;
	}

	/**
	 * Returns the sum of {engine.model.Node#offsetSize offset sizes} of all nodes contained inside this node list.
	 *
	 * @returns {Number}
	 */
	getMaxOffset() {
		return this._nodes.reduce( ( sum, node ) => sum + node.offsetSize, 0 );
	}

	/**
	 * Gets the node at the given index. Returns `null` if incorrect index was passed.
	 *
	 * @param {Number} index Index of node.
	 * @returns {engine.model.Node|null} Node at given index.
	 */
	getNode( index ) {
		return this._nodes[ index ] || null;
	}

	/**
	 * Returns an index of the given node. Returns `null` if given node is not inside this node list.
	 *
	 * @param {engine.model.Node} node Child node to look for.
	 * @returns {Number|null} Child node's index.
	 */
	getNodeIndex( node ) {
		const index = this._nodes.indexOf( node );

		return index == -1 ? null : index;
	}

	/**
	 * Returns the starting offset of given node. Starting offset is equal to the sum of
	 * {engine.model.Node#offsetSize offset sizes} of all nodes that are before this node in this node list.
	 *
	 * @param {engine.model.Node} node Node to look for.
	 * @returns {Number|null} Node's starting offset.
	 */
	getNodeStartOffset( node ) {
		const index = this.getNodeIndex( node );

		return index === null ? null : this._nodes.slice( 0, index ).reduce( ( sum, node ) => sum + node.offsetSize, 0 );
	}

	/**
	 * Converts index "position" to offset "position".
	 *
	 * Returns starting offset of a node that is at given index. If given index is too low, `0` is returned. If
	 * given index is too high, {@link engine.model.NodeList#getMaxOffset last available offset} is returned.
	 *
	 * @param {Number} index Node's index.
	 * @returns {Number} Node's starting offset.
	 */
	indexToOffset( index ) {
		if ( index == this._nodes.length ) {
			return this.getMaxOffset();
		}

		const node = this._nodes[ index ];

		if ( !node ) {
			/**
			 * Given index cannot be found in the node list.
			 *
			 * @error nodelist-index-out-of-bounds
			 */
			throw new CKEditorError( 'nodelist-index-out-of-bounds: Given index cannot be found in the node list.' );
		}

		return this.getNodeStartOffset( node );
	}

	/**
	 * Converts offset "position" to index "position".
	 *
	 * Returns index of a node that occupies given offset. If given offset is too low, `0` is returned. If
	 * given offset is too high, {@link engine.model.NodeList#length last available index} is returned.
	 *
	 * @param {Number} offset Offset to look for.
	 * @returns {Number} Index of a node that occupies given offset.
	 */
	offsetToIndex( offset ) {
		let totalOffset = 0;

		for ( let node of this._nodes ) {
			if ( offset >= totalOffset && offset < totalOffset + node.offsetSize  ) {
				return this.getNodeIndex( node );
			}

			totalOffset += node.offsetSize;
		}

		if ( totalOffset != offset ) {
			/**
			 * Given offset cannot be found in the node list.
			 *
			 * @error nodelist-offset-out-of-bounds
			 */
			throw new CKEditorError( 'nodelist-offset-out-of-bounds: Given offset cannot be found in the node list.' );
		}

		return this.length;
	}

	/**
	 * Inserts given nodes at given index.
	 *
	 * @param {Number} index Index at which nodes should be inserted.
	 * @param {Iterable.<engine.model.Node>} nodes Nodes to be inserted.
	 */
	insertNodes( index, nodes ) {
		// Validation.
		for ( let node of nodes ) {
			if ( !( node instanceof Node ) ) {
				/**
				 * Trying to insert an object which is not a Node instance.
				 *
				 * @error nodelist-insertNodes-not-node
				 */
				throw new CKEditorError( 'nodelist-insertNodes-not-node: Trying to insert an object which is not a Node instance.' );
			}
		}

		this._nodes.splice( index, 0, ...nodes );
	}

	/**
	 * Removes one or more nodes starting at the given index.
	 *
	 * @param {Number} indexStart Index of the first node to remove.
	 * @param {Number} [howMany=1] Number of nodes to remove.
	 * @returns {Array.<engine.model.Node>} Array containing removed nodes.
	 */
	removeNodes( indexStart, howMany = 1 ) {
		return this._nodes.splice( indexStart, howMany );
	}

	/**
	 * Converts `NodeList` instance to an array containing nodes that were inserted in the node list. Nodes
	 * are also converted to their plain object representation.
	 *
	 * @returns {Array.<engine.model.Node>} `NodeList` instance converted to `Array`.
	 */
	toJSON() {
		return this._nodes.map( ( node ) => node.toJSON() );
	}
}
