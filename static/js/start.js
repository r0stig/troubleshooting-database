var REMOVED_TAG = '_removed';
var SUBFOLDER = SUBFOLDER || '';


function Question(data) {
    this.id = ko.observable(data.id);
    this.question = ko.observable(data.question);
    this.answer = ko.observable(data.answer);
    this.tags = ko.observableArray(data.tags);
}

function QuestionListViewModel(tagsInputWrapper, li) {
    // Data 
    var self = this;
    
    self.questions = ko.observableArray([]);
    self.visible_questions = ko.computed(function () {
        return ko.utils.arrayFilter(self.questions(), function(q) {
            var visible = true;
            ko.utils.arrayForEach(q.tags(), function(tag) {
               if (tag == REMOVED_TAG) {
                    visible = false;   
               }
            });
            return visible;
        });
    });
    self.newQuestionText = ko.observable();
    self.newQuestionAnswer = ko.observable();
    self.newQuestionTags = ko.observableArray([]);
    
    
    // Operations
    self.addQuestion = function () {
        var q = new Question({ question: self.newQuestionText(),
                                          answer: self.newQuestionAnswer(),
                                          tags: self.newQuestionTags() });
        self.questions.push(q);
        
        self.newQuestionText('');
        self.newQuestionAnswer('');
        self.newQuestionTags([]);
        tagsInputWrapper.clear();
        self.storeServer(q);
        
        return false;
    };
    
    self.addTag = function (tag) {
        self.newQuestionTags.push(tag);
        /*var oldval = typeof self.newQuestionTags() === 'undefined' ? '' : self.newQuestionTags() + ',';
        console.log(typeof(self.newQuestionTags()));
        self.newQuestionTags(oldval + tag);
        */
        
    };
    self.removeTag = function (tag) {
        self.newQuestionTags.remove(tag);  
    };
    
    self.removeQuestion = function (question) {
        // Add tag removed
        question.tags.push(REMOVED_TAG);
        self.updateServer(question);
    };

    self.quickEdit = function(question, evt) {
        $(evt.target).parent().find('.question').toggle();
        $(evt.target).parent().find('.answer').toggle();
        $(evt.target).parent().find('.questionInput').toggle();
        $(evt.target).parent().find('.answerInput').toggle();

        $(evt.target).toggle();
        $(evt.target).parent().find('.saveQuickEdit').toggle();
    };

    self.saveQuickEdit = function(question, evt) {
        self.updateServer(question);

        $(evt.target).parent().find('.question').toggle();
        $(evt.target).parent().find('.answer').toggle();
        $(evt.target).parent().find('.questionInput').toggle();
        $(evt.target).parent().find('.answerInput').toggle();
        $(evt.target).toggle();
        $(evt.target).parent().find('.quickEdit').toggle();
    };
    
    self.storeServer = function (question) { 
        li.beginRequest();
        $.ajax({
            url: '/' + SUBFOLDER + 'question', 
            type: 'POST',
            data: JSON.stringify({ 'question': question.question(), 
                'answer': question.answer(),
                'tags': question.tags()}),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: function(data) {
                question.id(data.id);
                li.stopRequest();
            }
        });
    };
    
    self.updateServer = function (question) { 
        li.beginRequest();
        $.ajax({
            url: '/' + SUBFOLDER + 'question/' + question.id(), 
            type: 'PUT',
            data: JSON.stringify({ 'question': question.question(), 
                'answer': question.answer(),
                'tags': question.tags()}),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: function(data) {
                //question = new Question(data);
                li.stopRequest();
            }
        });
    };
    
    self.removeServer = function (question) { 
        $.ajax({
            url: '/' + SUBFOLDER + 'question/' + question.id(), 
            type: 'DELETE',
            contentType: "application/json; charset=utf-8",
            dataType: 'json'
        });
    
    };
    
    // load data
    $.getJSON('/' + SUBFOLDER + 'questions', function(data) {
        var mappedQuestions = $.map(data, function(item) {
            return new Question(item);
        });
        self.questions(mappedQuestions);
    });
    
    
}

function loadIndicator(el) {
    return {
        beginRequest: function () {
            $(el).show();
            $(el).text('Communication with backend...');
        },
        stopRequest: function () {
            $(el).hide();
        }
    }
}

function tagsInputWrapper(el) {
    var self = this;
    
    var currentTags = [];
    return {
        init: function (cbAdd, cbRemove) {
            $(el).tagsInput({
                onAddTag: function (tag) {
                    currentTags.push(tag);
                    cbAdd(tag);
                },
                onRemoveTag: function (tag) {
                    var index = currentTags.indexOf(tag);
                    if (index > -1 ) {
                        currentTags.splice(index, 1);
                    }
                    cbRemove(tag);
                }
            });
        },
        clear: function () {
            for(var i = 0; i < currentTags.length; i++) {
                $(el).removeTag(currentTags[i]);    
            }
            currentTags = [];
        }
        
    };
}

var tw = tagsInputWrapper($('input[name=tags]'));
var li = loadIndicator($('div#load'));
var viewModel = new QuestionListViewModel(tw, li);
ko.applyBindings(viewModel);


tw.init(viewModel.addTag, viewModel.removeTag);

/**
 * Custom binding for contentEditable, copied from: 
 * http://stackoverflow.com/questions/11448367/knockout-js-bind-to-editable-div-text
 * 
 **/
ko.bindingHandlers.editableText = {
    init: function(element, valueAccessor) {
        $(element).on('blur', function() {
            var observable = valueAccessor();
            observable( $(this).html() );
        });
    },
    update: function(element, valueAccessor) {
        //var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).html(value);
    }
};
/**
 * Custom binding for nl2br content, copied from:
 * http://stackoverflow.com/questions/18122854/custom-binding-nl2br-knockout-js
 * 
 **/
ko.bindingHandlers.nl2br = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var field = valueAccessor();
        field = markdown.toHTML(field);
        ko.bindingHandlers.html.update(element, function() { return field; });
    }
};

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }