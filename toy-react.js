const RENDER_TO_DOM  = Symbol("RENDER TO DOM")

export class Component {
      constructor() {
            this.props = Object.create(null);
            this.children = []
            this._root = null 
            this._range = null
      }
      setAttribute(name, value) {
            this.props[name] = value
      }
      appendChild(component) {
            this.children.push(component)
      }
      get vdom() {
           return this.render().vdom
      }
      [RENDER_TO_DOM](range) {
          this._range = range
          this._vdom = this.vdom
          this._vdom[RENDER_TO_DOM](range)
      }

      update() {
          let  isSameNode = (oldNode, newNode) => {
                if(oldNode.type !== newNode.type) {
                   return false
                }
                if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
                      return false
                }
                for(let name in newNode.props) {
                   if(newNode.props[name] !== oldNode.props[name]) {
                         return false
                   }          
                }
                
                if(newNode.type === "#text") {
                      if(newNode.content !== oldNode.content) {
                            return false
                      }
                }
                return true
          }
          let update = (oldNode, newNode) => {
               //type, props, children
               //#text content
               if(!isSameNode(oldNode, newNode)){
                     newNode[RENDER_TO_DOM](oldNode._range)
                     return
               }
               newNode._range = oldNode._range

               let newChildren = newNode.vchildren
               let oldChildren = oldNode.vchildren

               for(let i = 0; i < oldChildren.length; i++){
                  let newChild = newChildren[i]
                  let oldChild = oldChildren[i]
                  if (i < oldChildren.length) {
                     update(oldChild, newChild)
                  } else {
                      //TODO
                  }
            }
               
          }
          let vdom = this.vdom
          update(this._vdom, this.vdom)
          this._vdom = vdom
      }
      // rerender() {
      //       let oldRange = this._range

      //       let range = document.createRange()
      //       range.setStart(oldRange.startContainer, oldRange.startOffset)
      //       range.setEnd(oldRange.startContainer, oldRange.startOffset)
      //       this[RENDER_TO_DOM](range)
            
      //       oldRange.setStart(range.endContainer, range.endOffset)
      //       oldRange.deleteContents()
      // }
      setState(newState) {
            if (this.state === null || typeof this.state !== 'object') {
                  this.state = newState
                  this.update()
                  return
            }
      
            let merge = (oldState, newState) => {
               for(let p in newState) {
                     if(oldState[p] === null || typeof oldState[p] !== 'object') {
                        oldState[p] = newState[p]
                     } else {
                        merge(oldState[p], newState[p])
                     }
               }
            }

            merge(this.state, newState)
            this.update()
      }
}

class ElementWrapper extends Component {
      constructor(type) {
         super(type)
         this.type = type
      }
  
      // setAttribute(name, value) {
      //     if (name.match(/^on([\s\S]+)$/)) {
      //        this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
      //     } else {
      //        if (name === "className") {
      //             this.root.setAttribute('class', value);                 
      //        } else {
      //             this.root.setAttribute(name, value);
      //        }
      //     }
  
      // }
      // appendChild(component) {
      //       let range = document.createRange()
      //       range.setStart(this.root ,  this.root.childNodes.length)
      //       range.setEnd(this.root, this.root.childNodes.length)
      //       component[RENDER_TO_DOM](range)
      // }
      get vdom() {
            this.vchildren = this.children.map(child => child.vdom)
            return this
      }
      [RENDER_TO_DOM](range) {
            range.deleteContents();

            let root = document.createElement(this.type)

            for(let name in this.props) {
                  let value = this.props[name]
                  if (name.match(/^on([\s\S]+)$/)) {
                        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
                  } else {
                        if (name === "className") {
                              root.setAttribute('class', value);                 
                        } else {
                              root.setAttribute(name, value);
                        }
                  }
            }

            if(!this.vchildren) {
                  this.vchildren = this.children.map(child => child.vdom)
            }

            for (const child of this.vchildren) {
                  let chidlRange = document.createRange()
                  chidlRange.setStart(root ,root.childNodes.length)
                  chidlRange.setEnd(root, root.childNodes.length)
                  child[RENDER_TO_DOM](chidlRange)    
            }

            range.insertNode(root);
      } 
}

class TextWrapper extends Component{
      constructor(content) {
            super(content)
            this.type = '#text'
            this.content = content
            this.root = document.createTextNode(content)
      }
      get vdom() {
            return this
            // return {
            //       type: '#text',
            //       content: this.content
            // }
      }
      [RENDER_TO_DOM](range) {
            range.deleteContents();
            range.insertNode(this.root);
      }
}

export function createElement(type, attributes, ...children) {
      let e
      if(typeof type === "string") {
          e = new ElementWrapper(type)
      } else {
          e = new type
      }
      for (const p in attributes) {
          const element = attributes[p];
          e.setAttribute(p, attributes[p])        
      }
      let insertChihld = (children) => {
            for (let child of children) {
                  if (typeof child === 'string') {
                        child = new TextWrapper(child)
                  }
                  if (child === null) {
                        continue
                  }
                  if (typeof child === 'object' && child instanceof Array) {
                        insertChihld(child)
                  } else {
                        e.appendChild(child)
                  }
            }  
      }
      insertChihld(children)
      return e
}

export function render(component, parentElement) {
      let range = document.createRange()
      range.setStart(parentElement, 0)
      range.setEnd(parentElement, parentElement.childNodes.length)
      range.deleteContents() 
      component[RENDER_TO_DOM](range)
}

