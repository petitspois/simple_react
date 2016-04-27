(function(win, $){


    function ReactClass(){

    }

    ReactClass.prototype.render = function(){

    }

    function ReactDOMTextComponent(text){
        this._currentElement = '' + text;
        this._rootNodeID = null;
    }

    ReactDOMTextComponent.prototype.mountComponent = function(rootId){
        this._rootNodeID = rootId;
        return '<span data-reactid="'+rootId+'">'+this._currentElement+'</span>';
    }

    function ReactDOMComponent(elem){
        this._currentElement = elem;
        this._rootNodeID = null;
    }

    ReactDOMComponent.prototype.mountComponent = function(rootId){
        this._rootNodeID = rootId;
        var props = this._currentElement.props;
        var tagOpen = '<' + this._currentElement.type;
        var tagClose = '</'+this._currentElement.type + '>';
        tagOpen += ' data-reactid=' + this._rootNodeID;

        for(var propKey in props){
            if(/^on[A-Za-z]/.test(propKey)){
                var eventType = propKey.replace('on', '');
                $(document).on(eventType+'.'+this._rootNodeID, '[data-reactid="'+this._rootNodeID+'"]', props[propKey]);
            }
            if(props[propKey] && propKey !== 'children' && !/^on[A-Za-z]/.test(propKey)){
                tagOpen += ' '+ propKey + '=' + props[propKey];
            }
        }

        //获取子节点渲染出的内容
        var content = '';
        var children = props.children || [];
        var childrenInstances = [];
        var that = this;
        $.each(children, function(key, child){
            var childComponentInstance = instantiateReactComponent(child);
            childComponentInstance._mountIndex = key;
            childrenInstances.push(childComponentInstance);
            var curRootId = that._rootNodeID + '.' + key;
            var childMarkup = childComponentInstance.mountComponent(curRootId);
            content += '' + childMarkup;
        });

        this._renderedChildren = childrenInstances;

        return tagOpen +'>'+ content + tagClose;
    }

    function ReactCompositeComponent(elem){
        this._currentElement = elem;
        this._rootNodeID = null;
        this._instance = null;
    }

    ReactCompositeComponent.prototype.mountComponent = function(rootId){
        this._rootNodeID = rootId;
        var publicProps = this._currentElement.props;
        var ReactClass = this._currentElement.type;
        var inst = new ReactClass(publicProps);
        this._instance = inst;
        this._reactInternalInstance = this;
        if(inst.getInitialState){
            inst.state = inst.getInitialState();
        }
        if(inst.componentWillMount){
            inst.componentWillMount();
        }
        var renderedElement = this._instance.render();
        var renderedComponentInstance = instantiateReactComponent(renderedElement);
        this._renderedComponent = renderedComponentInstance;
        var renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);
        $(document).on('mountReady', function() {
             //调用inst.componentDidMount
             inst.componentDidMount && inst.componentDidMount();
        });

         return renderedMarkup;
    }


    function instantiateReactComponent(node){
        if(typeof node == 'string' || typeof node == 'number'){
            return new ReactDOMTextComponent(node);
        }
        if(typeof node == 'object' && typeof node.type == 'string'){
            return new ReactDOMComponent(node);
        }
        if(typeof node == 'object' && typeof node.type == 'function'){
            return new ReactCompositeComponent(node);
        }
    }

    function ReactElement(type,key,props){
      this.type = type;
      this.key = key;
      this.props = props;
    }

    react = {
        nextReactRootIndex:0,
        createClass:function(spec){
            var Constructor = function(props){
                this.props = props;
                this.state = this.getInitialState ? this.getInitialState : null;
            }
            Constructor.prototype = new ReactClass();
            Constructor.prototype.constructor = Constructor;
            $.extend(Constructor.prototype, spec);
            return Constructor;
        },
        createElement:function(type, config, children){
            var props = {},
                propName;
                config = config || {};
            var key = config.key || null;
            for(propName in config){
                if(config.hasOwnProperty(propName) && propName != 'key'){
                    props[propName] = config[propName];
                }
            }
            var childrenLength = arguments.length -2;
            if(childrenLength == 1){
                props.children = (children instanceof Array) ? children : [children];
            }else if(childrenLength>1){
                var childArray = Array(childrenLength);
                for(var i=0;i<childrenLength;i++){
                    childArray[i] = arguments[i+2];
                }
                props.children = childArray;
            }
            return new ReactElement(type, key, props);
        },
        render: function(elem, container){
            var componentInstance = instantiateReactComponent(elem);
            var markup = componentInstance.mountComponent(React.nextReactRootIndex++);
            container.innerHTML = markup;
            $(document).trigger('mountReady');
        }
    }

    win.React = react;

})(window, window.jQuery)
