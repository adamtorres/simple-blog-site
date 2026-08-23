from django import template
import markdown

register = template.Library()

@register.filter(name="render_markdown")
def render_markdown(text):
    """Render markdown text to HTML."""
    if not text:
        return ""
    return markdown.markdown(text, extensions=["extra", "codehilite", "tables"])