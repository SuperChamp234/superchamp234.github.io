#!/bin/bash

# Script to convert LaTeX resume to both HTML and PDF
# Usage: ./compile.sh [pandoc|latex2html]

# Default converter
CONVERTER="pandoc"

# Check if an argument was provided
if [ $# -eq 1 ]; then
    CONVERTER="$1"
    if [ "$CONVERTER" != "pandoc" ] && [ "$CONVERTER" != "latex2html" ]; then
        echo "Error: Invalid converter specified. Use 'pandoc' or 'latex2html'."
        echo "Usage: ./compile.sh [pandoc|latex2html]"
        exit 1
    fi
fi

# Check if pandoc is installed (needed if pandoc mode is selected)
if [ "$CONVERTER" = "pandoc" ] && ! command -v pandoc &> /dev/null; then
    echo "Error: pandoc is not installed. Please install it first."
    exit 1
fi

# Check if latex2html is installed (needed if latex2html mode is selected)
if [ "$CONVERTER" = "latex2html" ] && ! command -v latex2html &> /dev/null; then
    echo "Error: latex2html is not installed. Please install it first."
    exit 1
fi

# Check if pdflatex is installed
if ! command -v pdflatex &> /dev/null; then
    echo "Warning: pdflatex is not installed. PDF will not be generated."
    PDF_AVAILABLE=false
else
    PDF_AVAILABLE=true
fi

# Convert the LaTeX file to HTML
echo "Converting resume.tex to HTML using $CONVERTER..."

if [ "$CONVERTER" = "pandoc" ]; then
    # Use pandoc for conversion
    pandoc resume.tex -o resume_content.html \
      --standalone \
      --mathjax \
      --css=/css/resume.css \
      --template=custom-template.html \
      --from=latex \
      --to=html5
    
    CONVERSION_SUCCESS=$?
    HTML_FILE="resume_content.html"
    
elif [ "$CONVERTER" = "latex2html" ]; then
    # Create a directory for latex2html output
    mkdir -p latex2html_output
    
    # Use latex2html for conversion with improved options
    latex2html -dir ./latex2html_output \
      -no_navigation \
      -no_subdir \
      -split 0 \
      -info 0 \
      -address "" \
      -html_version 5.0 \
      -nocontents \
      -nofoot \
      -noimages \
      -math \
      resume.tex
    
    CONVERSION_SUCCESS=$?
    
    # latex2html creates an HTML file named after the tex file
    if [ -f "./latex2html_output/resume.html" ]; then
        # Process the output to make it compatible with our template
        # Create a more sophisticated processing of the output
        echo "Processing latex2html output..."
        
        # Extract just the body content with sed
        sed -n '/<BODY/,/<\/BODY>/p' ./latex2html_output/resume.html | \
          # Remove BODY tags themselves
          sed '1d;$d' | \
          # Fix common HTML entity errors
          sed 's/;SPMnbsp;/\&nbsp;/g' | \
          # Replace tex2html image marks with appropriate content
          sed 's/<SPAN CLASS="MATH"><tex2html_image_mark>#tex2html_wrap_inline[0-9]*#<\/SPAN>/•/g' > resume_content.html
          
        HTML_FILE="resume_content.html"
    else
        CONVERSION_SUCCESS=1
    fi
fi

# Check if HTML conversion was successful
if [ $CONVERSION_SUCCESS -eq 0 ]; then
    echo "HTML conversion successful!"
    
    # Copy the HTML content to the _includes directory as a Nunjucks template
    cp $HTML_FILE ../_includes/resume_content.njk
    
    # Create directory for website files
    mkdir -p ../_site/resume
    
    # Don't copy the source LaTeX file to keep it private
    echo "HTML files copied to site directories."
    
    # If using latex2html, copy the generated images if they exist
    if [ "$CONVERTER" = "latex2html" ] && [ -d "./latex2html_output/images" ]; then
        mkdir -p ../_site/resume/images
        cp -r ./latex2html_output/images/* ../_site/resume/images/
        echo "LaTeX2HTML images copied to site directories."
    fi
else
    echo "Error: HTML conversion failed."
    exit 1
fi

# Generate PDF if pdflatex is available
if [ "$PDF_AVAILABLE" = true ]; then
    echo "Compiling resume.tex to PDF..."
    pdflatex -interaction=nonstopmode resume.tex
    
    if [ $? -eq 0 ]; then
        echo "PDF conversion successful!"
        cp resume.pdf ../_site/resume/
    else
        echo "Error: PDF conversion failed."
    fi
fi

# Clean up auxiliary files
rm -f *.aux *.log *.out *.toc *.lof *.lot *.bbl *.blg

echo "Done!"
